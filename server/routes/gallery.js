const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Gallery = require('../models/Gallery');
const Setting = require('../models/Setting');
const { protect, admin, superAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = require('crypto').randomBytes(8).toString('hex');
    cb(null, `gallery-${Date.now()}-${uniqueSuffix}${ext}`);
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

const deleteImage = (imagePath) => {
  if (!imagePath || !imagePath.startsWith('/uploads')) return;
  const fullPath = path.join(__dirname, "..", imagePath);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
};

// Get all Gallery images
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    let adminId = tenantId;

    if (!adminId || adminId === 'undefined') {
      const superAdmin = await User.findOne({ role: "admin" }).lean();
      adminId = superAdmin ? superAdmin._id : null;
    }
    const filter = { adminId };

    const images = await Gallery.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new Gallery image (Admin only)
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const data = req.body;
    data.adminId = req.effectiveId; // Set creator context
    if (req.file) {
      data.imageUrl = `/uploads/${req.file.filename}`;
    }
    const image = await Gallery.create(data);
    res.status(201).json(image);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a Gallery image (Admin only)
router.put('/:id', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    if (!image) return res.status(404).json({ message: 'Image not found' });

    if (req.user.role !== 'admin' && image.adminId.toString() !== req.effectiveId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const data = req.body;
    if (req.file) {
      deleteImage(image.imageUrl);
      data.imageUrl = `/uploads/${req.file.filename}`;
    }

    Object.assign(image, data);
    await image.save();

    res.json(image);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a Gallery image (Admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    if (!image) return res.status(404).json({ message: 'Image not found' });
    
    if (req.user.role !== 'admin' && image.adminId.toString() !== req.effectiveId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    deleteImage(image.imageUrl);
    await image.deleteOne();
    
    res.json({ message: 'Image removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
