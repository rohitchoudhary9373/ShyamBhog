const mongoose = require('mongoose');

// Stub model — Hotel feature is currently inactive
const HotelUserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  password: { type: String },
  status: { type: String, default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('HotelUser', HotelUserSchema);
