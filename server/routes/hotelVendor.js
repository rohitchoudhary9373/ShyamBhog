const express = require('express');
const router = express.Router();
const { protect, hotelOwner } = require('../middleware/authMiddleware');
const Hotel = require('../models/Hotel');
const HotelRoom = require('../models/HotelRoom');
const HotelBooking = require('../models/HotelBooking');
const HotelPayout = require('../models/HotelPayout');

// @route   GET /api/vendor/dashboard
// @desc    Get vendor dashboard analytics
router.get('/dashboard', protect, hotelOwner, async (req, res) => {
  try {
    const hotels = await Hotel.find({ ownerId: req.user._id });
    const hotelIds = hotels.map(h => h._id);

    const bookings = await HotelBooking.find({ hotelId: { $in: hotelIds } });
    
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.vendorEarnings || 0), 0);
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.bookingStatus === 'pending').length;

    res.json({
      totalRevenue,
      totalBookings,
      pendingBookings,
      hotelsCount: hotels.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/vendor/hotels
// @desc    Get vendor's hotels
router.get('/hotels', protect, hotelOwner, async (req, res) => {
  try {
    const hotels = await Hotel.find({ ownerId: req.user._id });
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/vendor/hotels
// @desc    Create a new hotel (pending approval)
router.post('/hotels', protect, hotelOwner, async (req, res) => {
  try {
    const hotel = new Hotel({
      ...req.body,
      ownerId: req.user._id,
      status: 'pending' // Admin must approve
    });
    await hotel.save();
    res.status(201).json(hotel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route   GET /api/vendor/hotels/:hotelId/rooms
// @desc    Get rooms for a hotel
router.get('/hotels/:hotelId/rooms', protect, hotelOwner, async (req, res) => {
  try {
    const rooms = await HotelRoom.find({ hotelId: req.params.hotelId });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/vendor/hotels/:hotelId/rooms
// @desc    Add a room to hotel
router.post('/hotels/:hotelId/rooms', protect, hotelOwner, async (req, res) => {
  try {
    // Verify ownership
    const hotel = await Hotel.findOne({ _id: req.params.hotelId, ownerId: req.user._id });
    if (!hotel) return res.status(404).json({ message: 'Hotel not found or unauthorized' });

    const room = new HotelRoom({
      ...req.body,
      hotelId: hotel._id
    });
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route   GET /api/vendor/bookings
// @desc    Get bookings for vendor
router.get('/bookings', protect, hotelOwner, async (req, res) => {
  try {
    const bookings = await HotelBooking.find({ ownerId: req.user._id })
      .populate('roomId', 'name category')
      .populate('userId', 'name email mobile')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/vendor/bookings/:id/status
// @desc    Update booking status
router.put('/bookings/:id/status', protect, hotelOwner, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await HotelBooking.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.bookingStatus = status;
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
