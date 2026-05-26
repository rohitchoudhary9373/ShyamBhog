const mongoose = require('mongoose');

const TeamActivityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true // e.g. "link_partner", "update_permissions", "freeze_partner", "edit_service"
  },
  details: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  }
}, { timestamps: true });

TeamActivityLogSchema.index({ userId: 1 });
TeamActivityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('TeamActivityLog', TeamActivityLogSchema);
