const mongoose = require('mongoose');

const HotelStaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  googleMapsUrl: String,
  distanceFromTemple: String,
  priceRange: String,
  contactNumber: String,
  description: String,
  isActive: {
    type: Boolean,
    default: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('HotelStay', HotelStaySchema);
