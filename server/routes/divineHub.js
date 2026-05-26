const express = require('express');
const router = express.Router();
const DivineHub = require('../models/DivineHub');

const { protect, admin } = require('../middleware/authMiddleware');

// Get Divine Hub Data
router.get('/', async (req, res) => {
  try {
    let hub = await DivineHub.findOne();
    if (!hub) {
      // Create default if not exists
      hub = await DivineHub.create({ adminId: req.user?._id || '000000000000000000000000' });
    }
    res.json(hub);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Divine Hub Data
router.put('/', protect, admin, async (req, res) => {
  try {
    const updates = req.body;
    let hub = await DivineHub.findOne();
    
    if (hub) {
      hub = await DivineHub.findByIdAndUpdate(hub._id, updates, { new: true });
    } else {
      hub = await DivineHub.create({ ...updates, adminId: req.user?._id });
    }
    
    res.json(hub);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
