const express = require('express');
const router = express.Router();
const Parking = require('../models/Parking');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    const filter = { isActive: true };
    if (tenantId) filter.adminId = tenantId;
    
    const locations = await Parking.find(filter).sort({ createdAt: -1 });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const data = { ...req.body, adminId: req.effectiveId };
    const location = await Parking.create(data);
    res.status(201).json(location);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const location = await Parking.findById(req.params.id);
    if (!location) return res.status(404).json({ message: "Location not found" });

    if (req.user.role !== 'admin' && location.adminId.toString() !== req.effectiveId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await location.deleteOne();
    res.json({ message: 'Location removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
