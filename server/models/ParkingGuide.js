const mongoose = require('mongoose');

const ParkingGuideSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Parking & Streets'
  },
  description: String
}, { timestamps: true });

module.exports = mongoose.model('ParkingGuide', ParkingGuideSchema);
