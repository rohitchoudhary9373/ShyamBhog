const express = require('express');
const router = express.Router();
const { protect, hotelOwner } = require('../middleware/authMiddleware');
const { hotelVendorProtect } = require('../middleware/hotelAuthMiddleware');
const Hotel = require('../models/Hotel');
const HotelRoom = require('../models/HotelRoom');
const HotelBooking = require('../models/HotelBooking');
const HotelPayout = require('../models/HotelPayout');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = require('crypto').randomBytes(8).toString('hex');
    cb(null, `vendor-hotel-${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WEBP allowed"), false);
    }
    cb(null, true);
  },
});

// @route   GET /api/vendor/dashboard
// @desc    Get vendor dashboard analytics
router.get('/dashboard', hotelVendorProtect, async (req, res) => {
  try {
    const hotels = await Hotel.find({ ownerId: req.hotelOwner._id });
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
router.get('/hotels', hotelVendorProtect, async (req, res) => {
  try {
    const hotels = await Hotel.find({ ownerId: req.hotelOwner._id });
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/vendor/hotels
// @desc    Create a new hotel (pending approval)
router.post('/hotels', hotelVendorProtect, upload.single('image'), async (req, res) => {
  try {
    const hotelData = { ...req.body };
    
    if (req.file) {
      hotelData.imageUrl = `/uploads/${req.file.filename}`;
    }

    if (typeof hotelData.features === 'string') {
      try {
        hotelData.features = JSON.parse(hotelData.features);
      } catch (e) {
        hotelData.features = hotelData.features.split(',').map(f => f.trim()).filter(Boolean);
      }
    }

    const hotel = new Hotel({
      ...hotelData,
      ownerId: req.hotelOwner._id,
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
router.get('/hotels/:hotelId/rooms', hotelVendorProtect, async (req, res) => {
  try {
    const rooms = await HotelRoom.find({ hotelId: req.params.hotelId });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/vendor/hotels/:hotelId/rooms
// @desc    Add a room to hotel
router.post('/hotels/:hotelId/rooms', hotelVendorProtect, async (req, res) => {
  try {
    // Verify ownership
    const hotel = await Hotel.findOne({ _id: req.params.hotelId, ownerId: req.hotelOwner._id });
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
router.get('/bookings', hotelVendorProtect, async (req, res) => {
  try {
    const bookings = await HotelBooking.find({ ownerId: req.hotelOwner._id })
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
router.put('/bookings/:id/status', hotelVendorProtect, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await HotelBooking.findOne({ _id: req.params.id, ownerId: req.hotelOwner._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.bookingStatus = status;
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
