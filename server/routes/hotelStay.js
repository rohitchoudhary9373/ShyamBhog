const express = require('express');
const router = express.Router();
const HotelStay = require('../models/HotelStay');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    const filter = { isActive: true };
    if (tenantId) filter.adminId = tenantId;

    const hotels = await HotelStay.find(filter).sort({ createdAt: -1 });
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const data = { ...req.body, adminId: req.effectiveId };
    const hotel = await HotelStay.create(data);
    res.status(201).json(hotel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const hotel = await HotelStay.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    if (req.user.role !== 'admin' && hotel.adminId.toString() !== req.effectiveId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await hotel.deleteOne();
    res.json({ message: 'Hotel removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
