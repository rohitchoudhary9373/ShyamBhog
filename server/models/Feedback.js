const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: false
  },
  message: {
    type: String,
    required: true
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
