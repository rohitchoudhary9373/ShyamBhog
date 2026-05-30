const mongoose = require('mongoose');

const HotelPayoutSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processed'],
    default: 'pending'
  },
  referenceId: String // e.g. Bank transaction ID
}, { timestamps: true });

module.exports = mongoose.model('HotelPayout', HotelPayoutSchema);
