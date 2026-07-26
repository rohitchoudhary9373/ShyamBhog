const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Setting = require("../models/Setting");
const TeamActivityLog = require("../models/TeamActivityLog");
const { OAuth2Client } = require('google-auth-library');
const { protect } = require("../middleware/authMiddleware");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

// ── Helper ──────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// ── POST /api/auth/register ──────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;
    if (!name || (!mobile && !email) || !password)
      return res.status(400).json({ message: "Name, Credential (Mobile/Email), and Password are required" });

    if (mobile) {
      const mobileExists = await User.findOne({ mobile });
      if (mobileExists) return res.status(400).json({ message: "Mobile number already registered" });
    }

    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({ name, mobile, email, password });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: { _id: user._id, name: user.name, mobile: user.mobile, email: user.email, role: user.role, permissions: user.permissions },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/login ────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { mobile, password, email } = req.body;
    const identifier = mobile || email;
    if (!identifier || !password)
      return res.status(400).json({ message: "Mobile/Email and password are required" });

    const user = await User.findOne({ 
      $or: [
        { mobile: identifier },
        { email: identifier }
      ]
    }).select("+password");

    if (!user)
      return res.status(400).json({ message: "No account found with this credential" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect password" });

    if (user.status === 'blocked') {
      return res.status(403).json({ message: "Your account is blocked. Please contact support." });
    }

    // Track login history (keep last 10)
    await User.findByIdAndUpdate(user._id, {
      $push: {
        loginHistory: {
          $each: [{ ip: req.ip, userAgent: req.headers["user-agent"] }],
          $slice: -10,
        },
      },
    });

    res.json({
      success: true,
      token: generateToken(user._id),
      user: { 
        _id: user._id, 
        name: user.name, 
        mobile: user.mobile, 
        email: user.email, 
        role: user.role, 
        permissions: user.permissions,
        parentAdmin: user.parentAdmin,
        features: user.features
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/google ───────────────────────
router.post("/google", async (req, res) => {
  try {
    const { tokenId, isAccessToken } = req.body;
    if (!tokenId) return res.status(400).json({ message: "No token provided" });

    let name, email, googleId, profilePic;

    if (isAccessToken) {
      // Fetch user info using access token
      const googleRes = await require('axios').get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenId}` }
      });
      ({ name, email, sub: googleId, picture: profilePic } = googleRes.data);
    } else {
      const ticket = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      ({ name, email, sub: googleId, picture: profilePic } = ticket.getPayload());
    }

    const adminEmail = 'rohitchoudhary9373@gmail.com';
    const isTargetAdmin = email && email.toLowerCase() === adminEmail.toLowerCase();
    const adminPermissions = [
      'manage_services', 
      'manage_content', 
      'manage_bookings', 
      'manage_feedback', 
      'manage_finance', 
      'manage_agents',
      'manage_settings',
      'manage_gallery'
    ];

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        name,
        email,
        googleId,
        profilePic,
        role: isTargetAdmin ? 'admin' : 'user',
        permissions: isTargetAdmin ? adminPermissions : [],
        authProvider: 'google',
        lastLogin: Date.now()
      });
    } else {
      // Update existing user with google info and sync latest
      user.googleId = googleId;
      user.profilePic = profilePic;
      user.name = name;
      user.lastLogin = Date.now();
      if (isTargetAdmin) {
        user.role = 'admin';
        user.permissions = adminPermissions;
      }
      if (user.authProvider !== 'google') {
        user.authProvider = 'google';
      }
      await user.save();
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ message: "Your account is blocked." });
    }

    // Track login history
    await User.findByIdAndUpdate(user._id, {
      $push: {
        loginHistory: {
          $each: [{ ip: req.ip, userAgent: req.headers["user-agent"] }],
          $slice: -10,
        },
      },
    });

    res.json({
      success: true,
      token: generateToken(user._id),
      user: { 
        _id: user._id, 
        name: user.name, 
        mobile: user.mobile, 
        email: user.email, 
        role: user.role, 
        permissions: user.permissions,
        parentAdmin: user.parentAdmin,
        features: user.features
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/auth/me ────────────────────────────
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

// ── PUT /api/auth/profile ─────────────────────────
router.put("/profile", protect, async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated here
    delete updates.password;
    delete updates.role;
    delete updates.walletBalance;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/auth/change-password ────────────────
router.put("/change-password", protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // If user has existing password, verify old password
    if (user.password) {
      if (!oldPassword) {
        return res.status(400).json({ message: "Please provide current password" });
      }
      const isMatch = await user.matchPassword(oldPassword);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/impersonate ───────────────────────
router.post("/impersonate", protect, async (req, res) => {
  try {
    // Check if the requesting user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only administrators can impersonate users" });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    if (targetUser.role === 'admin') {
      return res.status(400).json({ message: "Cannot impersonate other administrators" });
    }

    if (targetUser.status === 'blocked') {
      return res.status(400).json({ message: "Cannot impersonate blocked users" });
    }

    // Generate token for target user
    const targetToken = generateToken(targetUser._id);

    // Log the impersonation switch
    try {
      await TeamActivityLog.create({
        userId: req.user._id,
        action: "impersonation_switch",
        details: `Administrator ${req.user.name} (${req.user.mobile}) impersonated user ${targetUser.name} (${targetUser.mobile})`,
        ipAddress: req.ip || '',
        userAgent: req.headers["user-agent"] || ''
      });
    } catch (logErr) {
      console.error("Failed to log impersonation switch:", logErr);
    }

    res.json({
      success: true,
      token: targetToken,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        mobile: targetUser.mobile,
        email: targetUser.email,
        role: targetUser.role,
        permissions: targetUser.permissions,
        parentAdmin: targetUser.parentAdmin,
        features: targetUser.features
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/impersonate/return ──────────────────
router.post("/impersonate/return", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only administrators can log impersonation returns" });
    }

    const { targetUserId } = req.body;
    let targetUserStr = "unknown user";
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (targetUser) {
        targetUserStr = `${targetUser.name} (${targetUser.mobile})`;
      }
    }

    // Log the return event
    try {
      await TeamActivityLog.create({
        userId: req.user._id,
        action: "impersonation_return",
        details: `Administrator ${req.user.name} (${req.user.mobile}) returned from impersonating user ${targetUserStr}`,
        ipAddress: req.ip || '',
        userAgent: req.headers["user-agent"] || ''
      });
    } catch (logErr) {
      console.error("Failed to log impersonation return:", logErr);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;