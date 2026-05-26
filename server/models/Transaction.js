const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  amount: {
    type: Number,
    required: true
  },
  openingBalance: {
    type: Number,
    required: false
  },
  closingBalance: {
    type: Number,
    required: false
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  method: {
    type: String,
    enum: ['razorpay', 'wallet', 'admin_adjustment', 'admin_transfer', 'admin_self_topup'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed', 'refunded', 'cancelled', 'completed'],
    default: 'pending'
  },
  description: String,
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ArjeeOrder'
  },
  referenceTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: false
  },
  razorpayPaymentId: {
    type: String,
    required: false
  },
  razorpayOrderId: {
    type: String,
    required: false
  }
}, { timestamps: true });

TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ adminId: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ referenceTransactionId: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
