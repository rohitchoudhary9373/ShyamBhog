const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Hotel = require('../models/Hotel');
const { protect, admin } = require('../middleware/authMiddleware');

// Ensure uploads folder
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = require('crypto').randomBytes(8).toString('hex');
    cb(null, `hotel-${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WEBP image files are allowed"), false);
    }
    cb(null, true);
  },
});

// @route   GET /api/hotels
// @desc    Get all active hotels
// @access  Public
router.get('/', async (req, res) => {
  try {
    const hotels = await Hotel.find({ isActive: true }).sort({ stars: -1, createdAt: -1 });
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/hotels
// @desc    Admin: Add a hotel with image upload
// @access  Private/Admin
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const hotelData = { ...req.body };
    
    // Handle uploaded file
    if (req.file) {
      hotelData.imageUrl = `/uploads/${req.file.filename}`;
    }

    // Parse features if stringified
    if (typeof hotelData.features === 'string') {
      try {
        hotelData.features = JSON.parse(hotelData.features);
      } catch (e) {
        hotelData.features = hotelData.features.split(',').map(f => f.trim()).filter(Boolean);
      }
    }

    const hotel = new Hotel(hotelData);
    const newHotel = await hotel.save();
    res.status(201).json(newHotel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route   PUT /api/hotels/:id
// @desc    Admin: Update a hotel with image upload
// @access  Private/Admin
router.put('/:id', protect, admin, upload.single('image'), async (req, res) => {
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

    const updatedHotel = await Hotel.findByIdAndUpdate(req.params.id, hotelData, { new: true });
    res.json(updatedHotel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route   DELETE /api/hotels/:id
// @desc    Admin: Delete a hotel
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    await Hotel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hotel deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/hotels/:id/moderate
// @desc    Admin: Approve, reject, or suspend a hotel
// @access  Private/Admin
router.put('/:id/moderate', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'active', 'suspended', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    res.json(hotel);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
