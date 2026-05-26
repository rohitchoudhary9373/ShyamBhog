const mongoose = require('mongoose');

const RitualVideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title']
  },
  category: {
    type: String,
    enum: ['Arjee', 'Bhog', 'Swamani'],
    required: true
  },
  videoUrl: {
    type: String,
    required: false
  },
  instagramUrl: {
    type: String,
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  },
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

module.exports = mongoose.model('RitualVideo', RitualVideoSchema);
