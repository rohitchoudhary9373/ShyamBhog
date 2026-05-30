const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const HotelUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, default: 'hotel_customer' },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  lastLogin: { type: Date, default: Date.now }
}, { timestamps: true });

// Encrypt password before saving
HotelUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('HotelUser', HotelUserSchema);
