const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');
const { protect, admin, superAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Get all FAQs
router.get('/', async (req, res) => {
  try {
    const { tenantId, category } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (tenantId) filter.adminId = tenantId;

    const faqs = await FAQ.find(filter).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get FAQs by category (Legacy Support)
router.get('/cat/:category', async (req, res) => {
  try {
    const faqs = await FAQ.find({ category: req.params.category }).sort({ order: 1 });
    res.json({ success: true, data: faqs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new FAQ (Admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const data = req.body;
    
    // If admin provides adminId in query, use it. Otherwise use effectiveId.
    if (req.user.role === 'admin' && req.query.adminId) {
       data.adminId = req.query.adminId;
    } else {
       data.adminId = req.effectiveId;
    }

    const faq = await FAQ.create(data);
    res.status(201).json(faq);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an FAQ (Admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });

    if (req.user.role !== 'admin' && faq.adminId.toString() !== req.effectiveId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    Object.assign(faq, req.body);
    await faq.save();
    res.json(faq);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete an FAQ (Admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });

    if (req.user.role !== 'admin' && faq.adminId.toString() !== req.effectiveId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await faq.deleteOne();
    res.json({ message: 'FAQ removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
