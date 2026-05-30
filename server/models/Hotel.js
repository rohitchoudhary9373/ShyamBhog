const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  imageUrl: String,
  address: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  priceRange: String, // e.g. "₹1,500 - ₹3,000"
  bookingUrl: String,
  googleLocationUrl: String,
  distanceFromTemple: String,
  stars: {
    type: Number,
    default: 3
  },
  features: [String], // e.g. ["Free WiFi", "AC", "Breakfast", "Near Temple"]
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended'],
    default: 'approved'
  },
  commissionRate: {
    type: Number, // Percentage, e.g. 15 for 15%
    default: null // If null, falls back to global setting
  },
  gallery: [String],
  policies: {
    cancellation: String,
    checkInTime: String,
    checkOutTime: String,
    houseRules: [String]
  },
  faqs: [{
    question: String,
    answer: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Hotel', HotelSchema);
