const Razorpay = require('razorpay');
const Refund = require('../models/Refund');
const ArjeeOrder = require('../models/ArjeeOrder');
const Counter = require('../models/Counter');
const PaymentAuditLog = require('../models/PaymentAuditLog');
const walletService = require('./walletService');
const paymentService = require('./paymentService');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class RefundService {
  /**
   * Process a refund request (initiated by admin).
   * @param {string} refundId - The ID of the Refund request document
   * @param {string} adminId - The admin processing the refund
   * @param {string} status - 'approved' | 'rejected'
   * @param {string} adminRemarks - Reason/remarks
   * @param {string} method - 'razorpay' | 'wallet' | 'manual'
   * @param {number} [amount] - Option to override refund amount (partial refund)
   */
  async processRefund(refundId, adminId, status, adminRemarks, method, amount = null) {
    const refund = await Refund.findById(refundId).populate('orderId');
    if (!refund) throw new ApiError(404, 'Refund request not found');

    if (refund.status !== 'pending') {
      throw new ApiError(400, 'Refund request has already been processed');
    }

    const order = refund.orderId;
    if (!order) throw new ApiError(404, 'Booking order associated with refund not found');

    const refundAmount = amount || refund.amount;

    if (refundAmount <= 0 || refundAmount > refund.amount) {
      throw new ApiError(400, `Invalid refund amount. Maximum possible: INR ${refund.amount}`);
    }

    // Capture logs
    await PaymentAuditLog.create({
      userId: refund.userId,
      orderId: order._id,
      action: `refund_processing_${status}`,
      payload: { refundId, refundAmount, method, status }
    });

    if (status === 'approved') {
      if (method === 'razorpay') {
        const { keyId, keySecret } = await paymentService.getRazorpayKeys();
        if (!keyId || !keySecret) {
          throw new ApiError(400, 'Razorpay keys not configured for refund execution');
        }

        const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const paymentId = order.paymentId;
        if (!paymentId) {
          throw new ApiError(400, 'No Razorpay payment ID found on the order to refund');
        }

        try {
          // Execute Razorpay refund API
          const rzpRefund = await rzp.payments.refund(paymentId, {
            amount: Math.round(refundAmount * 100), // paise
            notes: {
              refundId: refund._id.toString(),
              orderId: order._id.toString(),
              remarks: adminRemarks
            }
          });

          // Log verification response details from Razorpay
          refund.adminRemarks = `${adminRemarks || ''} [Razorpay Refund ID: ${rzpRefund.id}]`;
          
          await PaymentAuditLog.create({
            userId: refund.userId,
            orderId: order._id,
            action: 'razorpay_refund_success',
            status: 'success',
            payload: rzpRefund
          });

        } catch (rzpErr) {
          logger.error(`Razorpay Refund API failure: ${rzpErr.description || rzpErr.message}`);
          await PaymentAuditLog.create({
            userId: refund.userId,
            orderId: order._id,
            action: 'razorpay_refund_failed',
            status: 'failure',
            payload: { error: rzpErr.description || rzpErr.message }
          });
          throw new ApiError(500, `Razorpay API Refund failed: ${rzpErr.description || rzpErr.message}`);
        }
      } else if (method === 'wallet') {
        // Credit funds back to user wallet ledger
        const description = `Refund approved for Booking Invoice: ${order.invoiceNumber}`;
        await walletService.credit(refund.userId, refundAmount, 'wallet', description, adminId, null, true);
      }

      // Generate sequential refund receipt number
      const counter = await Counter.findOneAndUpdate(
        { id: 'refund_seq' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      refund.receiptNumber = `SB-REF-${counter.seq.toString().padStart(4, '0')}`;

      // Update Order Status
      order.status = 'Refunded';
      await order.save();
    }

    refund.status = status;
    refund.amount = refundAmount;
    refund.adminRemarks = adminRemarks || refund.adminRemarks;
    refund.refundMethod = method || 'manual';
    refund.processedAt = Date.now();
    await refund.save();

    // Trigger Notification Background Jobs
    try {
      const { addJob } = require('../queues/queueManager');
      await addJob('email', 'sendRefund', { refundId: refund._id.toString() });
      await addJob('whatsapp', 'sendRefund', { refundId: refund._id.toString() });
    } catch (queueErr) {
      logger.error(`Failed to queue refund notification background jobs: ${queueErr.message}`);
    }

    return refund;
  }
}

module.exports = new RefundService();
