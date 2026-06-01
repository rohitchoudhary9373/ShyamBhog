const express = require('express');
const router = express.Router();
const CrowdStatus = require('../models/CrowdStatus');
const DarshanWaitTime = require('../models/DarshanWaitTime');
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

// GET /wait-times - Public endpoint to retrieve wait times in a rolling date window
router.get('/wait-times', async (req, res) => {
  try {
    const { tenantId } = req.query;
    let adminId = tenantId;
    if (!adminId || adminId === 'undefined') {
      const User = require('../models/User');
      const superAdmin = await User.findOne({ role: "admin" }).lean();
      adminId = superAdmin ? superAdmin._id : null;
    }

    const getLocalDateString = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const getWeekdayName = (dateStr) => {
      const date = new Date(dateStr + 'T00:00:00');
      const options = { weekday: 'long' };
      return new Intl.DateTimeFormat('en-US', options).format(date);
    };

    let todayDate = getLocalDateString(new Date());
    let startDate = req.query.startDate || todayDate;
    let endDate = req.query.endDate;
    
    if (!endDate) {
      let sDate = new Date(startDate + 'T00:00:00');
      sDate.setDate(sDate.getDate() + 6);
      endDate = getLocalDateString(sDate);
    }

    const dates = [];
    let current = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    let maxDays = 31;
    while (current <= end && maxDays > 0) {
      dates.push(getLocalDateString(current));
      current.setDate(current.getDate() + 1);
      maxDays--;
    }

    const configs = await DarshanWaitTime.find({ adminId, isActive: true }).lean();

    const result = dates.map(dStr => {
      const wDay = getWeekdayName(dStr);
      let match = configs.find(c => c.exactDate === dStr);
      if (!match) {
        match = configs.find(c => !c.exactDate && c.weekday.toLowerCase() === wDay.toLowerCase());
      }

      return {
        date: dStr,
        weekday: wDay,
        lines: match ? match.lines : [
          { range: "Line 1 - 4", time: "25 min", label: "Best" },
          { range: "Line 5 - 8", time: "20 min" },
          { range: "Line 9 - 11", time: "25 min" }
        ],
        _id: match ? match._id : null
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /wait-times/admin - Fetch all configs (including inactive/recurring) for admin view
router.get('/wait-times/admin', protect, admin, async (req, res) => {
  try {
    const adminId = req.effectiveId;
    const configs = await DarshanWaitTime.find({ adminId }).sort({ exactDate: 1, weekday: 1 });
    res.json(configs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /wait-times/bulk - Bulk add/update multiple entries
router.post('/wait-times/bulk', protect, admin, async (req, res) => {
  try {
    const adminId = req.effectiveId;
    const { entries } = req.body;
    if (!Array.isArray(entries)) {
      return res.status(400).json({ success: false, message: "Entries must be an array" });
    }

    const results = [];
    for (const entry of entries) {
      const { exactDate, weekday, lines, priority, isActive } = entry;
      const finalExactDate = (exactDate && exactDate.trim() !== "") ? exactDate : null;
      let record;
      if (finalExactDate) {
        record = await DarshanWaitTime.findOneAndUpdate(
          { adminId, exactDate: finalExactDate },
          { weekday, lines, priority, isActive },
          { new: true, upsert: true }
        );
      } else {
        record = await DarshanWaitTime.findOneAndUpdate(
          { adminId, exactDate: null, weekday },
          { lines, priority, isActive },
          { new: true, upsert: true }
        );
      }
      results.push(record);
    }

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /wait-times/:id - Update single entry
router.put('/wait-times/:id', protect, admin, async (req, res) => {
  try {
    const adminId = req.effectiveId;
    const record = await DarshanWaitTime.findOneAndUpdate(
      { _id: req.params.id, adminId },
      req.body,
      { new: true }
    );
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /wait-times/:id - Delete single entry
router.delete('/wait-times/:id', protect, admin, async (req, res) => {
  try {
    const adminId = req.effectiveId;
    const record = await DarshanWaitTime.findOneAndDelete({ _id: req.params.id, adminId });
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
