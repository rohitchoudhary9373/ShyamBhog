const express = require('express');
const router = express.Router();
const CrowdStatus = require('../models/CrowdStatus');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    let adminId = tenantId;
    if (!adminId || adminId === 'undefined') {
      const User = require('../models/User');
      const superAdmin = await User.findOne({ role: "admin" }).lean();
      adminId = superAdmin ? superAdmin._id : null;
    }

    let status = await CrowdStatus.findOne({ adminId });
    if (!status) {
        status = await CrowdStatus.create({ status: 'Low', adminId });
    }
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/share', async (req, res) => {
  try {
    const { tenantId, platform } = req.body;
    let adminId = tenantId;
    if (!adminId || adminId === 'undefined') {
      const User = require('../models/User');
      const superAdmin = await User.findOne({ role: "admin" }).lean();
      adminId = superAdmin ? superAdmin._id : null;
    }

    const allowedPlatforms = ['whatsapp', 'telegram', 'facebook', 'twitter', 'link'];
    if (!allowedPlatforms.includes(platform)) {
      return res.status(400).json({ success: false, message: "Invalid platform" });
    }
    
    const updateField = `analytics.${platform}Shares`;
    await CrowdStatus.findOneAndUpdate(
      { adminId },
      { $inc: { [updateField]: 1, 'analytics.totalShares': 1 } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/', protect, admin, async (req, res) => {
  try {
    let status = await CrowdStatus.findOne({ adminId: req.effectiveId });
    if (status) {
      status = await CrowdStatus.findByIdAndUpdate(status._id, req.body, { new: true });
    } else {
      status = await CrowdStatus.create({ ...req.body, adminId: req.effectiveId });
    }
    res.json(status);
    
    // Real-time update via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.emit("crowdUpdate", { status: status.status });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
