const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { protect, admin, superAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');

// 🔹 GET APPROVED FEEDBACK (Public)
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    let adminId = tenantId;

    if (!adminId || adminId === 'undefined') {
      const superAdminUser = await User.findOne({ role: 'admin' });
      if (superAdminUser) adminId = superAdminUser._id;
    }

    const filter = { isApproved: true, adminId };
    const feedback = await Feedback.find(filter)
                                   .sort({ createdAt: -1 })
                                   .select('-mobile');
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🔹 SUBMIT NEW FEEDBACK (Public)
router.post('/', async (req, res) => {
  try {
    const { name, mobile, message, tenantId } = req.body;
    if (!name || !message) {
      return res.status(400).json({ message: "Name and message are required" });
    }

    let adminId = tenantId;
    if (!adminId || adminId === 'undefined') {
      const superAdminUser = await User.findOne({ role: 'admin' });
      if (superAdminUser) adminId = superAdminUser._id;
    }

    if (!adminId) return res.status(400).json({ message: "No tenant found" });

    const feedback = await Feedback.create({ 
      name, 
      mobile, 
      message, 
      adminId 
    });
    res.status(201).json({ success: true, message: "Feedback submitted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 🔹 GET ALL FEEDBACK (Admin)
router.get('/admin', protect, admin, async (req, res) => {
  try {
    const { tenantId } = req.query;
    const filter = {};

    if (req.user.role !== 'admin') {
      filter.adminId = req.effectiveId;
    } else if (tenantId && tenantId !== 'all') {
      filter.adminId = tenantId;
    }
    // If tenantId is 'all' or superAdmin, return all user submitted reviews

    const feedback = await Feedback.find(filter).populate('adminId', 'name').sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🔹 ADMIN CREATES FEEDBACK MANUALLY
router.post('/admin', protect, admin, async (req, res) => {
  try {
    const { name, message } = req.body;
    if (!name || !message) {
      return res.status(400).json({ message: "Name and message are required" });
    }
    let feedback = await Feedback.create({ name, message, adminId: req.effectiveId, isApproved: true });
    feedback = await feedback.populate('adminId', 'name');
    res.status(201).json(feedback);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 🔹 TOGGLE APPROVE STATUS (Admin)
router.put('/:id/approve', protect, admin, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    
    if (req.user.role !== 'admin' && feedback.adminId.toString() !== req.effectiveId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    feedback.isApproved = !feedback.isApproved;
    await feedback.save();
    
    res.json(feedback);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 🔹 DELETE FEEDBACK (Admin)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    
    if (req.user.role !== 'admin' && feedback.adminId.toString() !== req.effectiveId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await feedback.deleteOne();
    res.json({ message: 'Feedback removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
