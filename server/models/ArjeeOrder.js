const mongoose = require('mongoose');

const ArjeeOrderSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: false // Allow guest checkout if needed, or enforce user login
  },
  name: {
    type: String,
    required: [true, 'Please provide devotee name']
  },
  whatsapp: {
    type: String,
    required: [true, 'Please provide WhatsApp number']
  },
  items: [{
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceItem' },
    title: String,
    price: Number,
    quantity: { type: Number, default: 1 },
    slot: Date,
    message: String,
    devoteeName: String,
    devoteeWhatsapp: String
  }],
  serviceType: {
    type: String,
    enum: ['Arjee', 'Bhog', 'Swamani', 'Cart'],
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['one-time', 'recurring'],
    default: 'one-time'
  },
  totalPrice: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  walletDeduction: {
    type: Number,
    default: 0
  },
  payableAmount: {
    type: Number,
    default: 0
  },
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  invoiceUrl: {
    type: String,
    default: ''
  },
  slot: {
    type: Date
  },
  message: {
    type: String
  },
  paymentId: {
    type: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Payment_Verified', 'Completed', 'Cancelled', 'Active', 'Refund_Requested', 'Refund_Processing', 'Refunded', 'Failed', 'Approved', 'Bhog_Approved', 'Invoice_Generated', 'Refund_Receipt_Generated'],
    default: 'Pending'
  }
}, { timestamps: true });

ArjeeOrderSchema.index({ adminId: 1 });
ArjeeOrderSchema.index({ userId: 1 });
ArjeeOrderSchema.index({ status: 1 });
ArjeeOrderSchema.index({ slot: 1 });
ArjeeOrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ArjeeOrder', ArjeeOrderSchema);
