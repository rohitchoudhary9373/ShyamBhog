const mongoose = require('mongoose');

const DivineHubSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  arjeeVideoUrl: {
    type: String,
    default: ''
  },
  crowdStatus: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low'
  },
  parkingUrl: {
    type: String,
    default: ''
  },
  hotelUrl: {
    type: String,
    default: ''
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('DivineHub', DivineHubSchema);
