const mongoose = require('mongoose');

const AartiTimingSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  aartiName: {
    type: String,
    required: true
  },
  startTime: {
    type: String, // Format: e.g. "04:30 AM" or "16:30"
    required: true
  },
  endTime: {
    type: String, // Format: e.g. "05:15 AM" or "17:15"
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0
  },
  repeatDailyForever: {
    type: Boolean,
    default: true
  },
  festivalDate: {
    type: String, // Format: YYYY-MM-DD, optional override date
    default: null
  }
}, { timestamps: true });

// Optimize query patterns
AartiTimingSchema.index({ adminId: 1, festivalDate: 1, isActive: 1 });

module.exports = mongoose.model('AartiTiming', AartiTimingSchema);
