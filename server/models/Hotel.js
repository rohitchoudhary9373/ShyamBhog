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
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Hotel', HotelSchema);
