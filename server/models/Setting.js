const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  brandName: { type: String, default: 'Shyam Bhog' },
  footerText: { type: String, default: 'Made with श्रद्धा by Shyam Bhog Team' },
  copyrightText: { type: String, default: '© 2026 Shyam Bhog Inc. All rights reserved.' },
  aboutText: {
    type: String,
    default: "Shyam Bhog is a digital devotion service where we offer your arjee to Shree Khatu Shyam Ji with care, authenticity, and complete faith. For devotees who live far away, have a busy schedule, or cannot visit the temple, we bring the sacred experience of the darbar directly to you. Every arjee is performed with proper rituals and respect, so you stay connected to Baba no matter where you are. Our purpose is simple — to make devotion easy, genuine, and accessible through the power of digital service."
  },
  contactEmail: { type: String, default: 'hello@shyambhog.com' },
  whatsapp: { type: String, default: '+91 9876543210' },
  facebookUrl: { type: String, default: '#' },
  instagramUrl: { type: String, default: '#' },
  youtubeUrl: { type: String, default: '#' },
  logoUrl: { type: String, default: '' },
  primaryColor: { type: String, default: '#f97316' },
  gstNumber: { type: String, default: '' },
  companyAddress: { type: String, default: '' },
  razorpayKeyId: { type: String, default: '' },
  razorpayKeySecret: { type: String, default: '' },
  termsContent: { type: String, default: '' },
  privacyPolicy: { type: String, default: '' },
  refundPolicy: { type: String, default: '' },
  shippingPolicy: { type: String, default: '' },
  serviceNature: { type: String, default: '' },
  arjeeVideoUrl: { type: String, default: '' },
  crowdStatus: { type: String, default: 'Low' },
  parkingUrl: { type: String, default: '' },
  gstEnabled: { type: Boolean, default: false },
  taxRate: { type: Number, default: 18 }
}, { timestamps: true });

module.exports = mongoose.model('Setting', SettingSchema);
