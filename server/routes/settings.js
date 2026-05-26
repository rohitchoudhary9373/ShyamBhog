const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Setting = require("../models/Setting");
const User = require("../models/User");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// ── Multer Config ────────────────────────────────
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = require('crypto').randomBytes(8).toString('hex');
    cb(null, `logo-${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB for logo
    fieldSize: 5 * 1024 * 1024, // 5MB for large text fields (policies)
    fields: 100 // Allow more fields
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.mimetype))
      return cb(new Error("Only JPG, PNG, and WEBP image files are allowed"), false);
    cb(null, true);
  },
});

// ── Helper: sanitize FormData strings ────────────
const clean = (val, fallback) => {
  if (val === undefined || val === null || val === "undefined" || val === "null" || val === "")
    return fallback;
  return val;
};

// ── GET /api/settings (Public) ───────────────────
// Returns the settings for the admin who runs this platform
router.get("/", async (req, res) => {
  try {
    // Always find the main admin (admin) for the storefront
    let adminId = req.query.tenantId;

    if (!adminId) {
      // Try to find the admin that actually has settings configured (like a logo)
      let configuredSettings = await Setting.findOne({ logoUrl: { $ne: "" } }).lean();
      
      if (configuredSettings) {
        adminId = configuredSettings.adminId;
      } else {
        // Fallback to the first admin if nothing is configured
        const superAdmin = await User.findOne({ role: "admin" }).lean();
        if (!superAdmin) return res.status(404).json({ message: "Platform not configured yet" });
        adminId = superAdmin._id;
      }
    }

    let settings = await Setting.findOne({ adminId }).select("-razorpayKeySecret");
    if (!settings) {
      const newSettings = await Setting.create({ adminId });
      settings = newSettings.toObject();
      delete settings.razorpayKeySecret;
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/settings (Admin Only) ───────────────
router.put("/", protect, admin, upload.single("logo"), async (req, res) => {
  try {
    const adminId = req.user._id;
    const adminPassword = req.body.adminPassword;

    if (!adminPassword) {
      return res.status(400).json({ message: "Administrator password is required to save changes." });
    }

    // Verify Admin Password
    const user = await User.findById(adminId).select("+password");
    const isMatch = await user.matchPassword(adminPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid administrator password. Security verification failed." });
    }

    let settings = await Setting.findOne({ adminId });
    if (!settings) {
      settings = new Setting({ adminId });
    }

    // Update text fields safely
    settings.brandName    = clean(req.body.brandName, settings.brandName);
    settings.footerText   = clean(req.body.footerText, settings.footerText);
    settings.copyrightText= clean(req.body.copyrightText, settings.copyrightText);
    settings.aboutText    = clean(req.body.aboutText, settings.aboutText);
    settings.contactEmail = clean(req.body.contactEmail, settings.contactEmail);
    settings.whatsapp     = clean(req.body.whatsapp, settings.whatsapp);
    settings.facebookUrl  = clean(req.body.facebookUrl, settings.facebookUrl);
    settings.instagramUrl = clean(req.body.instagramUrl, settings.instagramUrl);
    settings.youtubeUrl   = clean(req.body.youtubeUrl, settings.youtubeUrl);
    settings.primaryColor = clean(req.body.primaryColor, settings.primaryColor);
    settings.razorpayKeyId     = clean(req.body.razorpayKeyId, settings.razorpayKeyId);
    settings.razorpayKeySecret = clean(req.body.razorpayKeySecret, settings.razorpayKeySecret);
    settings.termsContent      = clean(req.body.termsContent, settings.termsContent);
    settings.privacyPolicy     = clean(req.body.privacyPolicy, settings.privacyPolicy);
    settings.refundPolicy      = clean(req.body.refundPolicy, settings.refundPolicy);
    settings.shippingPolicy    = clean(req.body.shippingPolicy, settings.shippingPolicy);
    settings.serviceNature     = clean(req.body.serviceNature, settings.serviceNature);
    settings.arjeeVideoUrl     = clean(req.body.arjeeVideoUrl, settings.arjeeVideoUrl);
    settings.crowdStatus       = clean(req.body.crowdStatus, settings.crowdStatus);
    settings.parkingUrl         = clean(req.body.parkingUrl, settings.parkingUrl);
    settings.gstNumber         = clean(req.body.gstNumber, settings.gstNumber);
    settings.companyAddress    = clean(req.body.companyAddress, settings.companyAddress);
    settings.gstEnabled        = req.body.gstEnabled === 'true' || req.body.gstEnabled === true;
    settings.taxRate           = Number(req.body.taxRate) || settings.taxRate;

    // Handle logo upload
    if (req.file) {
      // Delete old logo file
      if (settings.logoUrl && settings.logoUrl.startsWith("/uploads/")) {
        const oldFile = path.join(__dirname, "..", settings.logoUrl);
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }
      settings.logoUrl = `/uploads/${req.file.filename}`;
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    console.error("SETTINGS_SAVE_ERROR:", err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
