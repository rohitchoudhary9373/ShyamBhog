const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const RitualVideo = require('../models/RitualVideo');
const { protect, admin } = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = require('crypto').randomBytes(8).toString('hex');
    cb(null, `ritual-${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only MP4, WEBM, OGG, and MOV video files are allowed"), false);
    }
    cb(null, true);
  }
});

const deleteFile = (filePath) => {
  if (!filePath || !filePath.startsWith('/uploads')) return;
  const fullPath = path.join(__dirname, "..", filePath);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
};

router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    const filter = {};
    if (tenantId) filter.adminId = tenantId;
    const videos = await RitualVideo.find(filter).sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, admin, upload.single('videoFile'), async (req, res) => {
  try {
    const data = { ...req.body, adminId: req.effectiveId };
    if (req.file) {
      data.videoUrl = `/uploads/${req.file.filename}`;
    }
    const video = await RitualVideo.create(data);
    res.status(201).json(video);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const video = await RitualVideo.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });
    if (req.user.role !== 'admin' && video.adminId.toString() !== req.effectiveId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    deleteFile(video.videoUrl);
    await video.deleteOne();
    res.json({ message: 'Video removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
