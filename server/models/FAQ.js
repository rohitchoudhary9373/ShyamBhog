const mongoose = require('mongoose');

const FAQSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['General', 'Hotel', 'Parking', 'Arjee', 'Bhog', 'Swamani'],
    default: 'General'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('FAQ', FAQSchema);
