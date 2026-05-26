const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  mobile: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values for unique index
  },
  email: {
    type: String,
    default: ''
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  profilePic: {
    type: String,
    default: ''
  },
  pincode: {
    type: String,
    default: ''
  },
  district: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'admin', 'agent'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'blocked'],
    default: 'active'
  },
  permissions: {
    type: [String],
    default: []
  },
  department: {
    type: String,
    default: 'Services'
  },
  profession: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  parentAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  walletFrozen: {
    type: Boolean,
    default: false
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'inactive'
  },
  loginHistory: [{
    timestamp: { type: Date, default: Date.now },
    ip: String,
    userAgent: String
  }],
  features: {
    walletEnabled: { type: Boolean, default: true },
    refundsEnabled: { type: Boolean, default: true },
    subscriptionsEnabled: { type: Boolean, default: true },
    agentsEnabled: { type: Boolean, default: true }
  },
  cart: {
    type: Array,
    default: []
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'not_submitted'],
    default: 'not_submitted'
  },
  kycDocuments: {
    gstNumber: String,
    udyamNumber: String,
    aadharNumber: String,
    gstDoc: String, // URL/Path
    aadharDoc: String,
    udyamDoc: String
  }
}, { timestamps: true });

// Encrypt password using bcrypt
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// UserSchema.index({ mobile: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ parentAdmin: 1 });

module.exports = mongoose.model('User', UserSchema);
