const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Hotel = require('../models/Hotel');
const HotelRoom = require('../models/HotelRoom');
const HotelBooking = require('../models/HotelBooking');
const crypto = require('crypto');
const Razorpay = require('razorpay');

// @route   GET /api/hotel-booking/search
// @desc    Search for hotels (public)
router.get('/search', async (req, res) => {
  try {
    const { location, checkIn, checkOut, guests } = req.query;
    // Basic active hotel retrieval for now. In a full system, you would check availability against HotelBooking.
    const hotels = await Hotel.find({ isActive: true, status: 'approved' });
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/hotel-booking/hotels/:id
// @desc    Get single hotel with rooms
router.get('/hotels/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    
    const rooms = await HotelRoom.find({ hotelId: hotel._id, isActive: true });
    res.json({ hotel, rooms });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/hotel-booking/book
// @desc    Create a hotel booking and Razorpay order
router.post('/book', protect, async (req, res) => {
  try {
    const { hotelId, roomId, checkInDate, checkOutDate, numberOfGuests, guestDetails } = req.body;

    const room = await HotelRoom.findById(roomId);
    const hotel = await Hotel.findById(hotelId);

    if (!room || !hotel) {
      return res.status(404).json({ message: 'Room or Hotel not found' });
    }

    // Calculate days
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) return res.status(400).json({ message: 'Invalid dates' });

    const totalAmount = room.basePrice * nights;
    
    // Calculate Commission
    const commissionRate = hotel.commissionRate || 15; // default 15%
    const commissionAmount = (totalAmount * commissionRate) / 100;
    const vendorEarnings = totalAmount - commissionAmount;

    const booking = new HotelBooking({
      userId: req.user._id,
      ownerId: hotel.ownerId,
      hotelId,
      roomId,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      guestDetails,
      totalAmount,
      commissionAmount,
      vendorEarnings,
      bookingStatus: 'pending',
      paymentStatus: 'pending'
    });

    await booking.save();

    // Create Razorpay Order
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const order = await rzp.orders.create({
      amount: totalAmount * 100, // paise
      currency: "INR",
      receipt: booking.bookingId
    });

    booking.razorpayOrderId = order.id;
    await booking.save();

    res.status(201).json({
      booking,
      orderId: order.id,
      amount: order.amount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/hotel-booking/verify
// @desc    Verify Razorpay payment
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    const booking = await HotelBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      booking.paymentStatus = 'paid';
      booking.bookingStatus = 'confirmed';
      booking.razorpayPaymentId = razorpay_payment_id;
      await booking.save();

      res.json({ success: true, message: 'Payment verified', booking });
    } else {
      booking.paymentStatus = 'failed';
      await booking.save();
      res.status(400).json({ success: false, message: 'Signature mismatch' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/hotel-booking/my-bookings
// @desc    Get logged in user's bookings
router.get('/my-bookings', protect, async (req, res) => {
  try {
    const bookings = await HotelBooking.find({ userId: req.user._id })
      .populate('hotelId', 'name imageUrl address contactNumber')
      .populate('roomId', 'name category')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
