const Refund = require('../models/Refund');
const ArjeeOrder = require('../models/ArjeeOrder');
const refundService = require('../services/refundService');
const ApiError = require('../utils/ApiError');

class RefundController {
  // POST /api/refunds/request
  async requestRefund(req, res) {
    const { orderId, reason, bankDetails, upiId } = req.body;

    const order = await ArjeeOrder.findById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (order.userId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You can only request refunds for your own orders");
    }

    const existing = await Refund.findOne({ orderId });
    if (existing) {
      throw new ApiError(400, "Refund already requested for this order");
    }

    const refund = await Refund.create({
      orderId,
      userId: req.user._id,
      adminId: order.adminId,
      amount: order.price || order.totalPrice || 0,
      reason,
      bankDetails,
      upiId
    });

    res.status(201).json({
      success: true,
      data: refund,
      message: "Refund request submitted"
    });
  }

  // GET /api/refunds/my
  async getMyRefunds(req, res) {
    const refunds = await Refund.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: refunds
    });
  }

  // GET /api/refunds/admin
  async getAdminRefunds(req, res) {
    const { tenantId } = req.query;
    const filter = {};

    if (req.user.role !== 'admin') {
      filter.adminId = req.effectiveId;
    } else if (tenantId) {
      filter.adminId = tenantId;
    }

    const refunds = await Refund.find(filter)
      .populate('orderId')
      .populate('userId', 'name mobile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: refunds
    });
  }

  // PUT /api/refunds/process/:id
  async processRefund(req, res) {
    const { status, adminRemarks, method } = req.body;
    const refundId = req.params.id;

    const refund = await Refund.findById(refundId);
    if (!refund) {
      throw new ApiError(404, "Refund request not found");
    }

    // Authorization check
    if (req.user.role !== 'admin' && refund.adminId.toString() !== req.effectiveId.toString()) {
      throw new ApiError(403, "Not authorized to process this refund");
    }

    // Process refund using service layer (takes care of Razorpay refund, wallet credits, receipt seq, and queues notifications)
    const updatedRefund = await refundService.processRefund(
      refundId,
      req.user._id,
      status,
      adminRemarks,
      method
    );

    res.json({
      success: true,
      message: `Refund ${status}`,
      data: updatedRefund
    });
  }
}

module.exports = new RefundController();
