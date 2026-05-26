const ArjeeOrder = require('../models/ArjeeOrder');
const User = require('../models/User');
const Refund = require('../models/Refund');
const bookingService = require('../services/bookingService');
const walletService = require('../services/walletService');
const ApiError = require('../utils/ApiError');

class BookingController {
  // POST /api/bookings
  async createBooking(req, res) {
    const { name, whatsapp, serviceType, message, slot, price, tenantId } = req.body;

    let adminId = tenantId;
    if (!adminId) {
      const superAdminUser = await User.findOne({ role: 'admin' });
      if (superAdminUser) adminId = superAdminUser._id;
    }
    if (!adminId) {
      throw new ApiError(400, "No tenant found");
    }

    const order = new ArjeeOrder({
      adminId,
      name,
      whatsapp,
      serviceType,
      message,
      slot: new Date(slot),
      price,
      status: "Pending"
    });

    const createdOrder = await order.save();

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: createdOrder
    });
  }

  // GET /api/bookings
  async getAllBookings(req, res) {
    const filter = {};
    if (req.user.role !== 'admin') {
      filter.adminId = req.effectiveId;
    }

    const orders = await ArjeeOrder.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  }

  // PUT /api/bookings/:id/status
  async updateStatus(req, res) {
    const { status } = req.body;
    const order = await ArjeeOrder.findById(req.params.id);

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (req.user.role !== 'admin' && order.adminId.toString() !== req.user._id.toString() && order.adminId.toString() !== req.user.parentAdmin?.toString()) {
       throw new ApiError(403, "You don't have permission to update this booking.");
    }

    const oldStatus = order.status;
    order.status = status || order.status;

    // ADMIN GENERATING INVOICE
    if (status === 'Invoice_Generated') {
      if (!order.invoiceNumber) {
        const year = new Date().getFullYear();
        const uniqueTimestamp = Date.now().toString().slice(-6); // professional unique ending
        order.invoiceNumber = `SB-INV-${year}-${uniqueTimestamp}`;
      }
      // Queue background jobs for PDF generation and notifications
      try {
        const { addJob } = require('../queues/queueManager');
        await addJob('invoice', 'generate', { orderId: order._id.toString() });
        await addJob('email', 'sendConfirmation', { orderId: order._id.toString() });
        await addJob('whatsapp', 'sendConfirmation', { orderId: order._id.toString() });
      } catch (queueErr) {
        console.error(`Failed to queue background jobs on invoice generation: ${queueErr.message}`);
      }
    }

    // AUTO-CREATE REFUND REQUEST IF CANCELLED OR REFUND REQUESTED BY ADMIN
    if ((status === 'Cancelled' || status === 'Refund_Requested') && oldStatus !== 'Cancelled' && oldStatus !== 'Refund_Requested') {
       const existingRefund = await Refund.findOne({ orderId: order._id });
       if (!existingRefund) {
          await Refund.create({
             orderId: order._id,
             userId: order.userId || req.user._id,
             adminId: order.adminId,
             amount: order.totalPrice || order.price || 0,
             reason: status === 'Cancelled' ? "Cancelled by Administrator" : "Refund Requested by Administrator",
             status: 'pending',
             refundMethod: order.walletDeduction > 0 ? 'wallet' : 'manual'
          });
       }
    }

    // PROCESS REFUND IF STATUS TRANSITIONED TO REFUNDED
    if (status === 'Refunded' && oldStatus !== 'Refunded') {
      const refund = await Refund.findOne({ orderId: order._id });
      if (refund && refund.status === 'pending') {
        const refundService = require('../services/refundService');
        await refundService.processRefund(refund._id, req.user._id, 'approved', 'Refund marked by Admin during status update', refund.refundMethod);
      }
    }

    // ADMIN GENERATING REFUND RECEIPT
    if (status === 'Refund_Receipt_Generated') {
      const Counter = require('../models/Counter');
      if (!order.invoiceNumber || !order.invoiceNumber.startsWith('SB-REF-')) {
        const counter = await Counter.findOneAndUpdate(
          { id: 'refund_seq' },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        order.invoiceNumber = `SB-REF-${counter.seq.toString().padStart(4, '0')}`;
      }
      // Sync corresponding Refund record if exists
      const refund = await Refund.findOne({ orderId: order._id });
      if (refund) {
        refund.receiptNumber = order.invoiceNumber;
        refund.status = 'approved';
        refund.processedAt = Date.now();
        await refund.save();
      }
    }

    await order.save();

    // Real-Time Socket Updates
    global.io?.emit('bookingUpdate', {
      orderId: order._id,
      status: order.status,
      userId: order.userId,
      invoiceNumber: order.invoiceNumber || null
    });

    res.json({ success: true, message: `Status updated to ${status.replace('_', ' ')}. Refund request created if applicable.` });
  }

  // POST /api/bookings/v2
  async createBookingV2(req, res) {
    const { name, whatsapp, items, totalPrice, taxAmount, serviceType, paymentMode, tenantId } = req.body;

    let adminId = tenantId;
    if (!adminId) {
      const superAdminUser = await User.findOne({ role: 'admin' });
      if (superAdminUser) adminId = superAdminUser._id;
    }

    const walletDeduction = req.body.walletDeduction || 0;
    const totalAmount = totalPrice;

    // Check slot locking first for V2 booking items
    for (const item of items) {
      if (item.slot) {
        await bookingService.acquireSlotLock(item.serviceId, req.user._id, item.slot, item.quantity);
      }
    }

    // Handle wallet deduction if applicable
    if (walletDeduction > 0) {
      try {
        const description = `Wallet payment for booking: ${serviceType || 'Devotional Service'}`;
        await walletService.debit(req.user._id, walletDeduction, 'wallet', description);
      } catch (err) {
        // Rollback any slot locks if wallet debit fails
        for (const item of items) {
          if (item.slot) {
            await bookingService.releaseSlotLock(item.serviceId, req.user._id, item.slot);
          }
        }
        throw err;
      }
    }

    // Create ONE consolidated order with items
    const order = new ArjeeOrder({
      adminId,
      userId: req.user._id,
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
      totalPrice: totalAmount,
      taxAmount: taxAmount || 0,
      walletDeduction,
      payableAmount: req.body.payableAmount || (totalAmount - walletDeduction),
      paymentMode: paymentMode || 'one-time',
      slot: items[0]?.slot ? new Date(items[0].slot) : new Date(),
      message: items[0]?.message || "",
      status: "Pending"
    });

    const isFullyPaid = walletDeduction >= totalAmount;
    await order.save();

    let finalOrder = order;
    if (isFullyPaid) {
      finalOrder = await bookingService.confirmBooking(order._id);
    }

    res.status(201).json({
      success: true,
      message: isFullyPaid ? "Booked Successfully! 🎉" : "Booking Recorded (Pending Payment)",
      data: finalOrder
    });
  }
}

module.exports = new BookingController();
