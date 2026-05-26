const mongoose = require('mongoose');

const CrowdStatusSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // HERO SECTION
  title: { type: String, default: 'Live Crowd Status' },
  subtitle: { type: String, default: 'Real-time darshan insights from Khatu Shyam Dham' },
  status: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Extreme'],
    default: 'Low'
  },
  waitingTime: { type: String, default: '15-30 Mins' },
  bestSlot: { type: String, default: 'Anytime Now' },
  percentage: { type: Number, default: 15 },
  description: { type: String, default: 'Peaceful darshan environment. Smooth movement through all corridors.' },
  liveStatusText: { type: String, default: 'Live Sync Active' },
  isLive: { type: Boolean, default: true },
  emergencyBanner: { type: String, default: '' },

  // TIME SLOTS
  slots: [{
    title: String,
    startTime: String,
    endTime: String,
    level: { type: String, enum: ['Low', 'Medium', 'High', 'Extreme'] },
    notes: String,
    order: { type: Number, default: 0 }
  }],

  // ADVISORIES
  advisories: [{
    text: String,
    order: { type: Number, default: 0 }
  }],

  // 🛰️ SHARE MANAGEMENT
  shareConfig: {
    enableSharing: { type: Boolean, default: true },
    platforms: {
      whatsapp: { type: Boolean, default: true },
      telegram: { type: Boolean, default: true },
      twitter: { type: Boolean, default: true },
      instagram: { type: Boolean, default: true }
    },
    template: {
      title: { type: String, default: 'Live Crowd Update from Khatu Shyam Dham' },
      message: { type: String, default: '🔱 Live Crowd Status: {status}\n⏳ Wait Time: {wait}\n🏰 Temple: {temple}\n\nCheck live updates here: {link}' },
      footer: { type: String, default: 'Official Digital Platform' },
      hashtags: { type: String, default: '#KhatuShyamJi #LiveDarshan #CrowdStatus' }
    },
    brandLogo: { type: String, default: '' },
    ctaText: { type: String, default: 'Share Live Status' }
  },

  // 📊 BASIC ANALYTICS
  analytics: {
    totalShares: { type: Number, default: 0 },
    whatsappShares: { type: Number, default: 0 },
    telegramShares: { type: Number, default: 0 },
    twitterShares: { type: Number, default: 0 },
    instagramShares: { type: Number, default: 0 },
    linkClicks: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('CrowdStatus', CrowdStatusSchema);
