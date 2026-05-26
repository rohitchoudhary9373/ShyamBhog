const mongoose = require('mongoose');

const PaymentAuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ArjeeOrder',
    required: false
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: false
  },
  action: {
    type: String,
    required: true // e.g. "payment_created", "signature_verified", "webhook_captured", "wallet_deducted"
  },
  status: {
    type: String,
    enum: ['info', 'success', 'failure', 'warning'],
    default: 'info'
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  }
}, { timestamps: true });

PaymentAuditLogSchema.index({ orderId: 1 });
PaymentAuditLogSchema.index({ transactionId: 1 });
PaymentAuditLogSchema.index({ userId: 1 });
PaymentAuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PaymentAuditLog', PaymentAuditLogSchema);
