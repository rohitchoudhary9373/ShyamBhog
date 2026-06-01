const mongoose = require('mongoose');

const DarshanWaitTimeSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exactDate: {
    type: String, // Format: YYYY-MM-DD
    default: null
  },
  weekday: {
    type: String, // e.g. "Monday", "Tuesday", etc.
    required: true
  },
  lines: [{
    range: { type: String, required: true }, // e.g. "Line 1 - 4"
    time: { type: String, required: true },  // e.g. "25 min"
    label: { type: String, default: '' }     // e.g. "Best"
  }],
  priority: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Add index for optimized queries
DarshanWaitTimeSchema.index({ adminId: 1, exactDate: 1, weekday: 1 });

module.exports = mongoose.model('DarshanWaitTime', DarshanWaitTimeSchema);
