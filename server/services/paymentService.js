const crypto = require('crypto');
const Razorpay = require('razorpay');
const User = require('../models/User');
const Setting = require('../models/Setting');
const ArjeeOrder = require('../models/ArjeeOrder');
const Transaction = require('../models/Transaction');
const PaymentAuditLog = require('../models/PaymentAuditLog');
const walletService = require('./walletService');
const bookingService = require('./bookingService');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class PaymentService {
  /**
   * Helper to load dynamic Razorpay API Keys from db settings or env.
   */
  async getRazorpayKeys() {
    const superAdmin = await User.findOne({ role: 'admin' }).lean();
    if (superAdmin) {
      const settings = await Setting.findOne({ adminId: superAdmin._id }).lean();
      if (settings?.razorpayKeyId && settings?.razorpayKeySecret) {
        return {
          keyId: settings.razorpayKeyId,
          keySecret: settings.razorpayKeySecret,
          webhookSecret: settings.razorpayWebhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || 'shyambhog_webhook_sec'
        };
      }
    }
    return {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_SECRET,
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'shyambhog_webhook_sec'
    };
  }

  /**
   * Verify Razorpay payment signature (standard client-side check).
   */
  async verifyPaymentSignature(orderId, paymentId, signature) {
    const { keySecret } = await this.getRazorpayKeys();
    const body = `${orderId}|${paymentId}`;
    const expectedSig = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
    return expectedSig === signature;
  }

  /**
   * Securely verify webhook payload authenticity.
   */
  async verifyWebhookSignature(rawBody, signatureHeader) {
    if (!signatureHeader) return false;
    const { webhookSecret } = await this.getRazorpayKeys();
    const expectedSig = crypto.createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
    
    try {
      return crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signatureHeader));
    } catch (e) {
      return false;
    }
  }

  /**
   * Initiate hybrid payment checkout. Deducts wallet balance immediately as a hold.
   */
  async initiateHybridCheckout(userId, bookingDetails) {
    const { name, whatsapp, items, totalPrice, taxAmount, walletDeduction, payableAmount, serviceType, paymentMode, tenantId } = bookingDetails;

    // Check slot locks and lock slots
    for (const item of items) {
      if (item.slot) {
        await bookingService.acquireSlotLock(item.serviceId, userId, item.slot, item.quantity);
      }
    }

    // Hold wallet deduction if > 0
    if (walletDeduction > 0) {
      try {
        const description = `Wallet hold for Hybrid checkout of ${serviceType || 'Devotional Service'}`;
        await walletService.debit(userId, walletDeduction, 'wallet', description);
      } catch (err) {
        // Rollback any slot locks if wallet debit fails
        for (const item of items) {
          if (item.slot) {
            await bookingService.releaseSlotLock(item.serviceId, userId, item.slot);
          }
        }
        throw err;
      }
    }

    let finalAdminId = tenantId;
    if (!finalAdminId || finalAdminId === 'undefined') {
      const superAdmin = await User.findOne({ role: "admin" }).lean();
      finalAdminId = superAdmin ? superAdmin._id : null;
    }

    // Save consolidated order as Pending
    const order = new ArjeeOrder({
      adminId: finalAdminId,
      userId,
      name,
      whatsapp,
      items: items.map(i => ({
        serviceId: i.serviceId,
        title: i.title,
        price: i.price,
        quantity: i.quantity || 1,
        slot: i.slot ? new Date(i.slot) : new Date(),
        message: i.message,
        devoteeName: i.devoteeName,
        devoteeWhatsapp: i.devoteeWhatsapp
      })),
      serviceType: serviceType || 'Arjee',
      totalPrice,
      taxAmount: taxAmount || 0,
      walletDeduction,
      payableAmount,
      paymentMode: paymentMode || 'one-time',
      slot: items[0]?.slot ? new Date(items[0].slot) : new Date(),
      message: items[0]?.message || "",
      status: "Pending"
    });

    await order.save();

    // Create a transaction record for auditing (pending state)
    const transaction = await Transaction.create({
      userId,
      adminId: order.adminId,
      amount: payableAmount,
      type: 'credit',
      method: 'razorpay',
      status: 'pending',
      description: `Razorpay portion for Hybrid booking order | Order: ${order._id}`,
      orderId: order._id
    });

    return { order, transaction };
  }

  /**
   * Finalize the hybrid payment after successful signature verification.
   */
  async finalizeHybridCheckout(orderId, paymentId, orderIdFromRazorpay) {
    const order = await ArjeeOrder.findById(orderId);
    if (!order) throw new ApiError(404, 'Booking order not found');

    if (order.status === 'Completed') {
      return order; // Already done
    }

    // Create payment success log
    await PaymentAuditLog.create({
      userId: order.userId,
      orderId: order._id,
      action: 'payment_success_verified',
      status: 'success',
      payload: { paymentId, orderIdFromRazorpay }
    });

    // 1. Confirm order and trigger background jobs
    await bookingService.confirmBooking(order._id, paymentId);

    // 2. Finalize Transaction records
    await Transaction.findOneAndUpdate(
      { orderId: order._id, method: 'razorpay' },
      { status: 'success', razorpayPaymentId: paymentId, razorpayOrderId: orderIdFromRazorpay }
    );

    return order;
  }

  /**
   * Rollback a failed or expired checkout. Refunds any held wallet deduction.
   */
  async rollbackCheckout(orderId, failureReason = 'Checkout cancelled or timed out') {
    const order = await ArjeeOrder.findById(orderId);
    if (!order || order.status === 'Completed' || order.status === 'Failed') {
      return;
    }

    logger.warn(`Rolling back checkout session for Order: ${orderId} | Reason: ${failureReason}`);

    // Update order status
    order.status = 'Failed';
    await order.save();

    // Rollback wallet balance if deducted
    if (order.walletDeduction > 0 && order.userId) {
      const description = `Rollback refund for failed booking checkout: ${orderId}`;
      await walletService.credit(order.userId, order.walletDeduction, 'wallet', description, null, null, true);
    }

    // Release any slot locks
    for (const item of order.items) {
      if (item.slot) {
        await bookingService.releaseSlotLock(item.serviceId, order.userId, item.slot);
      }
    }

    // Mark audit log
    await PaymentAuditLog.create({
      userId: order.userId,
      orderId: order._id,
      action: 'checkout_rolled_back',
      status: 'warning',
      payload: { reason: failureReason }
    });

    // Mark pending transaction log as failed
    await Transaction.findOneAndUpdate(
      { orderId: order._id, status: 'pending' },
      { status: 'failed', description: `Failed: ${failureReason}` }
    );
  }

  /**
   * Check for stale pending checkouts (older than 15 minutes), query Razorpay APIs to recover, or rollback.
   */
  async runTransactionRecovery() {
    const timeLimit = new Date(Date.now() - 15 * 60 * 1000); // 15 mins ago
    const staleOrders = await ArjeeOrder.find({
      status: 'Pending',
      createdAt: { $lt: timeLimit }
    });

    logger.info(`Running Transaction Recovery Job. Found ${staleOrders.length} stale pending orders.`);

    const { keyId, keySecret } = await this.getRazorpayKeys();
    if (!keyId || !keySecret) {
      logger.error('Skipping transaction recovery: Razorpay credentials not configured');
      return;
    }

    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });

    for (const order of staleOrders) {
      // Find associated transaction to get razorpay order id
      const tx = await Transaction.findOne({ orderId: order._id, method: 'razorpay' });
      if (!tx || !tx.razorpayOrderId) {
        // No Razorpay checkout session, rollback wallet hold directly
        await this.rollbackCheckout(order._id, 'No checkout transaction session found');
        continue;
      }

      try {
        // Fetch order status from Razorpay API
        const rzpOrder = await rzp.orders.fetch(tx.razorpayOrderId);
        
        if (rzpOrder.status === 'paid') {
          // Recover: User actually paid, confirm booking!
          logger.info(`Recovering Order ${order._id}: Razorpay order paid. Finalizing booking.`);
          
          // Try to fetch successful payments for the order to get payment ID
          const payments = await rzp.orders.fetchPayments(tx.razorpayOrderId);
          const successPayment = payments.items?.find(p => p.status === 'captured');
          const paymentId = successPayment ? successPayment.id : 'recovered_pay_id';

          await this.finalizeHybridCheckout(order._id, paymentId, tx.razorpayOrderId);
        } else {
          // Razorpay not paid, rollback
          await this.rollbackCheckout(order._id, 'Razorpay order status: ' + rzpOrder.status);
        }
      } catch (err) {
        logger.error(`Recovery failed for Order ${order._id}: ${err.message}`);
      }
    }
  }
}

module.exports = new PaymentService();
