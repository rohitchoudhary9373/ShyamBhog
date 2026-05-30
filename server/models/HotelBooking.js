const mongoose = require('mongoose');

const HotelBookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HotelUser',
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HotelOwner',
    required: true
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HotelRoom',
    required: true
  },
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    required: true
  },
  numberOfGuests: {
    type: Number,
    required: true
  },
  numberOfRooms: {
    type: Number,
    default: 1
  },
  guestDetails: {
    name: String,
    email: String,
    phone: String,
    specialRequests: String
  },
  totalAmount: {
    type: Number,
    required: true
  },
  commissionAmount: {
    type: Number,
    required: true
  },
  vendorEarnings: {
    type: Number,
    required: true
  },
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  cancellationReason: String
}, { timestamps: true });

// Pre-save to generate unique booking ID
HotelBookingSchema.pre('save', function(next) {
  if (!this.bookingId) {
    this.bookingId = 'HB-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  }
  next();
});

module.exports = mongoose.model('HotelBooking', HotelBookingSchema);
