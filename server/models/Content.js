const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['about', 'faq', 'promo', 'slider'],
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { timestamps: true });

// Ensure type is unique per admin
ContentSchema.index({ adminId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Content', ContentSchema);
