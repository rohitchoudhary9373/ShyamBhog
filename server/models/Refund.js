const mongoose = require('mongoose');

const RefundSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ArjeeOrder',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reason: {
    type: String,
    required: true
  },
  bankDetails: {
    accountHolder: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },
  upiId: String,
  refundMethod: {
    type: String,
    enum: ['wallet', 'razorpay', 'manual'],
    default: 'wallet'
  },
  adminRemarks: String,
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  processedAt: Date
}, { timestamps: true });

RefundSchema.index({ orderId: 1 });
RefundSchema.index({ userId: 1 });
RefundSchema.index({ adminId: 1 });
RefundSchema.index({ status: 1 });
RefundSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Refund', RefundSchema);
