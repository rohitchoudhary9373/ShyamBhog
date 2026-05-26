const mongoose = require('mongoose');

const ParkingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Government', 'Private'],
    default: 'Government'
  },
  googleMapsUrl: {
    type: String,
    required: true
  },
  distanceFromTemple: String, // e.g. "500m"
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

module.exports = mongoose.model('Parking', ParkingSchema);
