const ArjeeOrder = require('../models/ArjeeOrder');
const SlotLock = require('../models/SlotLock');
const ServiceItem = require('../models/ServiceItem');
const bookingRepository = require('../repositories/bookingRepository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const Counter = require('../models/Counter');

class BookingService {
  /**
   * Acquire a lock on a slot for a user.
   * @param {string} serviceId - The devotional service ID
   * @param {string} userId - Devotee ID
   * @param {string} slotDate - Chosen date
   * @param {number} quantity - Quantity of slots
   * @returns {Promise<object>} The SlotLock document
   */
  async acquireSlotLock(serviceId, userId, slotDate, quantity = 1) {
    logger.info(`Slot limit logic removed. Dummy lock returned for User ${userId} on Service ${serviceId}`);
    return {};
  }

  /**
   * Release a slot lock manually (e.g. on checkout cancellation).
   */
  async releaseSlotLock(serviceId, userId, slotDate) {
    logger.info(`Slot lock release skipped (slot limits removed). User ${userId} on Service ${serviceId}`);
  }

  /**
   * Finalize the booking order and trigger backend workers.
   */
  async confirmBooking(orderId, paymentId = null) {
    const order = await ArjeeOrder.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');

    if (order.status === 'Completed') {
      return order; // Already completed
    }

    // Update order
    order.status = 'Payment_Verified';
    if (paymentId) order.paymentId = paymentId;
    await order.save();

    // Slot locking logic is completely removed. No need to clear locks.

    // Real-Time Socket Updates
    const io = global.io; // we will set io on global inside server.js to use anywhere easily!
    if (io) {
      io.emit('bookingUpdate', {
        orderId: order._id,
        status: 'Payment_Verified',
        userId: order.userId,
        invoiceNumber: order.invoiceNumber || null
      });
    }

    // Invoices and confirmations are no longer auto-generated upon payment verification.
    // They will be triggered explicitly by the Admin.

    return order;
  }
}

module.exports = new BookingService();
