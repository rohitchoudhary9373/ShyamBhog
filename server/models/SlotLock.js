const mongoose = require('mongoose');

const SlotLockSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceItem',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  slot: {
    type: Date,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });

// Create compound index for querying locks on a specific slot for a service
SlotLockSchema.index({ serviceId: 1, slot: 1 });

// TTL Index: Auto delete document when expiresAt time is reached
SlotLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SlotLock', SlotLockSchema);
