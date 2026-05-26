const mongoose = require('mongoose');

const ServiceItemSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['Arjee', 'Bhog', 'Swamani'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  price: {
    type: Number,
    required: true
  },
  priceText: {
    type: String, // e.g. "₹99/month" or "₹249"
    required: false
  },
  features: {
    type: [String],
    default: []
  },
  benefits: {
    type: [String],
    default: []
  },
  steps: {
    type: [String],
    default: []
  },
  imageUrl: {
    type: String,
    default: ''
  },
  badge: {
    type: String,
    default: '' // e.g. "New"
  },
  tag: {
    type: String,
    default: '' // e.g. "Special Basket" or "Few slots left"
  },
  subtitle: {
    type: String,
    default: '' // e.g. "A dedicated Arjee, Reserved just for you."
  },
  isActive: {
    type: Boolean,
    default: true
  },
  paymentMode: {
    type: String,
    enum: ['one-time', 'recurring'],
    default: 'one-time'
  },
  enableCart: {
    type: Boolean,
    default: false
  },
  unit: {
    type: String, // e.g. "500g", "1kg", "1 Box"
    default: ""
  },
  stock: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  isFeaturedCart: {
    type: Boolean,
    default: false
  },
  cartPriority: {
    type: Number,
    default: 0
  },
  cartAddedCount: {
    type: Number,
    default: 0
  },
  includes: [
    {
      item: String, // e.g. "Malai Peda"
      qty: String   // e.g. "350 gm"
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('ServiceItem', ServiceItemSchema);
