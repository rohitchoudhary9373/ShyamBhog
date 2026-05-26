const Razorpay = require('razorpay');
const ArjeeOrder = require('../models/ArjeeOrder');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const PaymentAuditLog = require('../models/PaymentAuditLog');
const paymentService = require('../services/paymentService');
const walletService = require('../services/walletService');
const bookingService = require('../services/bookingService');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class PaymentController {
  // POST /api/payment/create-order
  async createOrder(req, res) {
    const { amount } = req.body;
    const { keyId, keySecret } = await paymentService.getRazorpayKeys();

    if (!keyId || !keySecret) {
      throw new ApiError(400, "Razorpay API Keys are missing. Please configure them in Admin Settings.");
    }

    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await rzp.orders.create({
      amount: Math.round(amount * 100), // convert to paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`
    });

    res.json({ success: true, ...order, key_id: keyId });
  }

  // POST /api/payment/verify
  async verifyPayment(req, res) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, purpose } = req.body;

    const isValid = await paymentService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      throw new ApiError(400, "Payment verification failed. Invalid signature.");
    }

    if (purpose === "wallet_topup") {
      const { amount } = req.body;
      if (!amount || amount <= 0) {
        throw new ApiError(400, "Invalid top-up amount");
      }

      // Verify payment directly from Razorpay API to prevent amount/order hijacking
      const { keyId, keySecret } = await paymentService.getRazorpayKeys();
      if (!keyId || !keySecret) {
        throw new ApiError(400, "Razorpay API Keys are missing.");
      }

      const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
      let rzpPayment;
      try {
        rzpPayment = await rzp.payments.fetch(razorpay_payment_id);
      } catch (err) {
        throw new ApiError(400, `Failed to retrieve payment from Razorpay: ${err.message}`);
      }

      const actualAmount = rzpPayment.amount / 100;
      if (rzpPayment.status !== 'captured' || actualAmount !== Number(amount)) {
        throw new ApiError(400, "Payment verification failed. Amount mismatch or transaction not captured.");
      }

      if (rzpPayment.order_id !== razorpay_order_id) {
        throw new ApiError(400, "Payment verification failed. Order ID mismatch.");
      }

      const description = `Wallet Top-up (Payment ID: ${razorpay_payment_id})`;
      await walletService.credit(req.user._id, Number(amount), 'razorpay', description, null, null);

      const updatedUser = await User.findById(req.user._id).lean();

      return res.json({
        success: true,
        message: "Wallet topped up successfully",
        newBalance: updatedUser.walletBalance
      });
    }

    res.json({ success: true, message: "Payment verified", paymentId: razorpay_payment_id });
  }

  // POST /api/payment/verify-hybrid
  async verifyHybrid(req, res) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, bookingDetails } = req.body;
    let targetOrderId = orderId;

    try {
      const isValid = await paymentService.verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isValid) {
        throw new ApiError(400, "Payment verification failed. Invalid signature.");
      }

      if (bookingDetails) {
        // Automatically create pending order and deduct wallet hold balance
        const checkoutData = await paymentService.initiateHybridCheckout(req.user._id, bookingDetails);
        targetOrderId = checkoutData.order._id;
      }

      const order = await ArjeeOrder.findById(targetOrderId);
      if (!order) {
        throw new ApiError(404, "Order not found");
      }

      // Process and finalize the hybrid order
      await paymentService.finalizeHybridCheckout(targetOrderId, razorpay_payment_id, razorpay_order_id);

      // Fetch the updated order
      const updatedOrder = await ArjeeOrder.findById(targetOrderId);

      res.json({ success: true, message: "Booking confirmed!", data: updatedOrder });
    } catch (err) {
      // Rollback and restore wallet balance if something goes wrong after wallet deduction
      if (targetOrderId) {
        try {
          await paymentService.rollbackCheckout(targetOrderId, err.message || 'Verification failed');
        } catch (rollbackErr) {
          logger.error(`Rollback failed for Order ${targetOrderId}: ${rollbackErr.message}`);
        }
      }
      throw err;
    }
  }

  // POST /api/payment/pay-with-wallet-v2
  async payWithWalletV2(req, res) {
    const { name, whatsapp, items, totalPrice, taxAmount, serviceType, paymentMode, tenantId } = req.body;

    // Check user balance first
    const user = await User.findById(req.user._id);
    if (user.walletBalance < totalPrice) {
      throw new ApiError(400, `Insufficient wallet balance. required: INR ${totalPrice}, current: INR ${user.walletBalance}`);
    }

    let adminId = tenantId;
    if (!adminId) {
      const superAdminUser = await User.findOne({ role: 'admin' });
      if (superAdminUser) adminId = superAdminUser._id;
    }

    // 1. Acquire slot locks first
    for (const item of items) {
      if (item.slot) {
        await bookingService.acquireSlotLock(item.serviceId, req.user._id, item.slot, item.quantity);
      }
    }

    // 2. Perform wallet debit
    const description = `Full wallet booking payment`;
    await walletService.debit(req.user._id, totalPrice, 'wallet', description);

    // 3. Create the order
    const order = new ArjeeOrder({
      adminId: adminId || user.parentAdmin || user._id,
      userId: user._id,
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
      walletDeduction: totalPrice,
      payableAmount: 0,
      paymentMode: paymentMode || 'one-time',
      slot: items[0]?.slot ? new Date(items[0].slot) : new Date(),
      message: items[0]?.message || "",
      status: "Pending"
    });

    await order.save();

    // 4. Finalize order (generates invoice, releases locks, triggers jobs)
    const confirmedOrder = await bookingService.confirmBooking(order._id);

    res.json({ success: true, message: "Booking confirmed via wallet!", data: confirmedOrder });
  }

  // POST /api/payment/record-failure
  async recordFailure(req, res) {
    const { amount, reason, orderId, type } = req.body;

    if (orderId && type === 'booking') {
      await paymentService.rollbackCheckout(orderId, reason || 'Transaction failed');
    } else {
      await Transaction.create({
        userId: req.user._id,
        adminId: req.user.parentAdmin || req.user._id,
        amount: Number(amount) || 0,
        type: "credit",
        method: "razorpay",
        description: `Failed Payment: ${reason || 'User cancelled or failed'}`,
        status: "failed"
      });
    }

    res.json({ success: true, message: "Failure recorded" });
  }

  // POST /api/payment/webhook
  async webhook(req, res) {
    try {
      const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf-8') : JSON.stringify(req.body);
      const signature = req.headers['x-razorpay-signature'];

      const isValid = await paymentService.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        logger.error('Invalid Razorpay Webhook signature received');
        throw new ApiError(400, 'Invalid webhook signature');
      }

      const payload = JSON.parse(rawBody);
      const event = payload.event;
      logger.info(`Processing Razorpay Webhook Event: ${event}`);

      if (event === 'payment.captured') {
        const payment = payload.payload.payment.entity;
        const razorpayOrderId = payment.order_id;
        const paymentId = payment.id;
        const amount = payment.amount / 100; // convert paise to INR

        // Find transaction for this order
        const tx = await Transaction.findOne({ razorpayOrderId }).populate('orderId');
        if (tx) {
          if (tx.orderId && tx.status === 'pending') {
            await paymentService.finalizeHybridCheckout(tx.orderId._id, paymentId, razorpayOrderId);
          } else if (tx.status === 'pending') {
            // Wallet Top-up
            await walletService.credit(tx.userId, amount, 'razorpay', `Wallet Top-up via Webhook (Payment ID: ${paymentId})`, null, null);
            tx.status = 'success';
            tx.razorpayPaymentId = paymentId;
            await tx.save();
          }
        } else {
          // If transaction doesn't exist, we audit log it
          await PaymentAuditLog.create({
            action: 'webhook_unassociated_payment',
            status: 'warning',
            payload: { paymentId, razorpayOrderId, amount }
          });
        }
      } else if (event === 'refund.processed') {
        const refund = payload.payload.refund.entity;
        const paymentId = refund.payment_id;
        const refundId = refund.id;

        logger.info(`Refund processed webhook received: Refund ID: ${refundId} | Payment: ${paymentId}`);
        await PaymentAuditLog.create({
          action: 'webhook_refund_processed',
          status: 'success',
          payload: { refundId, paymentId, amount: refund.amount / 100 }
        });
      }

      res.status(200).json({ status: 'ok' });
    } catch (err) {
      logger.error(`Webhook processing error: ${err.message}`);
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new PaymentController();
