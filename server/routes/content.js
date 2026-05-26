const express = require('express');
const Content = require('../models/Content');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/content/:type
// @desc    Get dynamic content for a specific tenant
// @access  Public
router.get('/:type', async (req, res) => {
  try {
    const { tenantId } = req.query;
    let query = { type: req.params.type };

    if (tenantId && tenantId !== 'all') {
      query.adminId = tenantId;
    } else {
      // Default to admin content if no tenantId
      const User = require('../models/User');
      const superAdmin = await User.findOne({ role: 'admin' });
      if (superAdmin) query.adminId = superAdmin._id;
    }

    const content = await Content.findOne(query);
    if (content) {
      res.json(content);
    } else {
      res.status(404).json({ message: 'Content not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/content/:type
// @desc    Update dynamic content for logged-in admin
// @access  Private/Admin
router.put('/:type', protect, admin, async (req, res) => {
  try {
    const { type } = req.params;
    const { data } = req.body;
    let adminId = req.user._id;

    if (req.user.role === 'admin' && req.query.adminId) {
      adminId = req.query.adminId;
    }

    let content = await Content.findOne({ type, adminId });

    if (content) {
      content.data = data;
      await content.save();
      res.json(content);
    } else {
      content = await Content.create({ type, data, adminId });
      res.status(201).json(content);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
