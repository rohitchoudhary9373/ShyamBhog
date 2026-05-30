const express = require("express");
const User = require("../models/User");
const HotelUser = require("../models/HotelUser");
const HotelOwner = require("../models/HotelOwner");
const TeamActivityLog = require("../models/TeamActivityLog");
const { protect, admin, superAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Helper for logging team activities
const logActivity = async (userId, action, details, req) => {
  try {
    await TeamActivityLog.create({
      userId,
      action,
      details,
      ipAddress: req.ip || '',
      userAgent: req.headers["user-agent"] || ''
    });
  } catch (err) {
    console.error("Activity logging error:", err);
  }
};


// ==============================
// 👥 GET ALL USERS (ADMIN)
// ==============================
router.get("/", protect, admin, async (req, res) => {
  try {
    const filter = {};
    // If not super admin, only fetch normal users
    if (req.user.role !== 'admin') {
      filter.role = 'user';
    }
    const users = await User.find(filter).select("-password");

    res.json({
      success: true,
      count: users.length,
      data: users,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ==============================
// 👤 GET PROFILE (LOGGED IN USER)
// ==============================
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      data: user,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ==============================
// ✏️ UPDATE PROFILE
// ==============================
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, mobile } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name || user.name;
    user.mobile = mobile || user.mobile;
    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ==============================
// ❌ DELETE USER (ADMIN)
// ==============================
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================
// 🚫 BLOCK/UNBLOCK USER (ADMIN)
// ==============================
router.put("/:id/toggle-status", protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === 'admin') return res.status(400).json({ message: "Cannot block super admin" });

    user.status = user.status === 'blocked' ? 'active' : 'blocked';
    await user.save();

    const actionName = user.status === 'blocked' ? "freeze_partner" : "unfreeze_partner";
    await logActivity(req.user._id, actionName, `${user.status === 'blocked' ? 'Froze' : 'Activated'} partner account: ${user.name} (${user.mobile})`, req);

    res.json({ success: true, message: `User status changed to ${user.status}`, data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/users/agents-activity-logs - Fetch recent team activity logs
router.get("/agents-activity-logs", protect, admin, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin') {
      const orgUsers = await User.find({ 
        $or: [
          { _id: req.effectiveId },
          { parentAdmin: req.effectiveId }
        ]
      }).select("_id");
      const userIds = orgUsers.map(u => u._id);
      filter.userId = { $in: userIds };
    }
    const logs = await TeamActivityLog.find(filter)
      .populate("userId", "name mobile role")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/users/agents-analytics - Get team workforce analytics
router.get("/agents-analytics", protect, admin, async (req, res) => {
  try {
    const filter = { role: 'agent' };
    if (req.user.role !== 'admin') {
      filter.parentAdmin = req.effectiveId;
    }

    const agents = await User.find(filter).select("department status loginHistory");
    
    const departmentCounts = {};
    let activeCount = 0;
    let blockedCount = 0;
    let totalLogins = 0;

    agents.forEach(a => {
      const dept = a.department || 'Services';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
      
      if (a.status === 'blocked') blockedCount++;
      else activeCount++;

      if (a.loginHistory) totalLogins += a.loginHistory.length;
    });

    res.json({
      success: true,
      data: {
        totalForce: agents.length,
        activeCount,
        blockedCount,
        totalLogins,
        departmentCounts
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================
// 👥 AGENT MANAGEMENT (ADMIN/SUPER ADMIN)
// ==============================

// ==============================
// 👥 AGENT MANAGEMENT (ADMIN/SUPER ADMIN)
// ==============================

const bcrypt = require("bcryptjs");

// Get all resellers (Admin/Super Admin)
router.get("/resellers", protect, admin, async (req, res) => {
  try {
    // For single-tenant transition, we just return other admins if super, 
    // or empty if it's a regular admin.
    const filter = { role: 'admin' };
    if (req.user.role !== 'admin') {
      return res.json({ success: true, data: [] });
    }
    const admins = await User.find(filter).select("-password");
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all agents (Admin sees their own, Super Admin sees all)
router.get("/agents", protect, admin, async (req, res) => {
  try {
    const filter = { role: 'agent' };
    const agents = await User.find(filter)
      .populate('parentAdmin', 'name')
      .select("-password");
    res.json({ success: true, data: agents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new agent
router.post("/agents", protect, admin, async (req, res) => {
  try {
    const { name, mobile, password, email, department, profession, avatar, permissions } = req.body;

    // Check if exists
    const exists = await User.findOne({ mobile });
    if (exists) return res.status(400).json({ message: "Mobile number already registered" });

    // Create agent (Model hook will hash password)
    const agent = await User.create({
      name,
      mobile,
      email,
      password,
      role: 'agent',
      parentAdmin: req.user._id,
      status: 'active',
      department: department || 'Services',
      profession: profession || '',
      avatar: avatar || '',
      permissions: permissions || []
    });

    await logActivity(req.user._id, "link_partner", `Linked new partner: ${name} (${mobile}) to department: ${agent.department}`, req);

    res.status(201).json({ success: true, message: "Agent created successfully", data: agent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update agent
router.put("/agents/:id", protect, admin, async (req, res) => {
  try {
    const { name, mobile, email, password, department, profession, avatar, status } = req.body;
    const agent = await User.findById(req.params.id);

    if (!agent || agent.role !== 'agent') {
      return res.status(404).json({ message: "Agent not found" });
    }

    // Check mobile uniqueness if changing
    if (mobile && mobile !== agent.mobile) {
      const exists = await User.findOne({ mobile });
      if (exists) return res.status(400).json({ message: "Mobile number already in use" });
      agent.mobile = mobile;
    }

    if (name) agent.name = name;
    if (email) agent.email = email;
    if (req.body.permissions) agent.permissions = req.body.permissions;
    if (department) agent.department = department;
    if (profession !== undefined) agent.profession = profession;
    if (avatar !== undefined) agent.avatar = avatar;
    if (status) agent.status = status;
    
    if (password) {
      agent.password = password;
    }

    await agent.save();

    await logActivity(req.user._id, "update_partner", `Updated partner profile for ${agent.name} (${agent.mobile})`, req);

    res.json({ success: true, message: "Agent updated successfully", data: agent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================
// 🔐 KYC MANAGEMENT
// ==============================

// Submit KYC (Reseller)
router.post("/kyc/submit", protect, async (req, res) => {
  try {
    const { gstNumber, udyamNumber, aadharNumber } = req.body;
    const user = await User.findById(req.user._id);
    
    user.kycDocuments = {
      gstNumber,
      udyamNumber,
      aadharNumber
    };
    user.kycStatus = 'pending';
    await user.save();
    
    res.json({ success: true, message: "KYC submitted for review" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify/Reject KYC (Super Admin)
router.put("/resellers/:id/kyc", protect, superAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ message: "Reseller not found" });
    
    user.kycStatus = status;
    await user.save();
    
    res.json({ success: true, message: `KYC status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk update permissions for any user
router.put("/permissions/:id", protect, superAdmin, async (req, res) => {
  try {
    const { permissions } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ message: "User not found" });
    
    user.permissions = permissions;
    await user.save();
    
    res.json({ success: true, message: "Permissions updated", data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================
// 🏨 GET HOTEL CUSTOMERS (ADMIN)
// ==============================
router.get("/hotel-customers", protect, admin, async (req, res) => {
  try {
    const users = await HotelUser.find({}).select("-password").sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================
// 🏨 TOGGLE HOTEL CUSTOMER STATUS (ADMIN)
// ==============================
router.put("/hotel-customers/:id/toggle-status", protect, admin, async (req, res) => {
  try {
    const user = await HotelUser.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Hotel customer not found" });
    user.status = user.status === 'blocked' ? 'active' : 'blocked';
    await user.save();
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================
// 🏨 DELETE HOTEL CUSTOMER (ADMIN)
// ==============================
router.delete("/hotel-customers/:id", protect, admin, async (req, res) => {
  try {
    const user = await HotelUser.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Hotel customer not found" });
    await user.deleteOne();
    res.json({ success: true, message: "Hotel customer deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================
// 🏢 GET HOTEL VENDORS/OWNERS (ADMIN)
// ==============================
router.get("/hotel-vendors", protect, admin, async (req, res) => {
  try {
    const owners = await HotelOwner.find({}).select("-password").sort({ createdAt: -1 });
    res.json({ success: true, count: owners.length, data: owners });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================
// 🏢 TOGGLE HOTEL VENDOR STATUS (ADMIN)
// ==============================
router.put("/hotel-vendors/:id/toggle-status", protect, admin, async (req, res) => {
  try {
    const owner = await HotelOwner.findById(req.params.id);
    if (!owner) return res.status(404).json({ message: "Hotel vendor not found" });
    owner.status = owner.status === 'blocked' ? 'active' : 'blocked';
    await owner.save();
    res.json({ success: true, data: owner });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;