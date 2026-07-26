const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ServiceItem = require("../models/ServiceItem");
const { protect, admin, superAdmin } = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();


// 🔹 Ensure uploads folder
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


// 🔹 Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = require('crypto').randomBytes(8).toString('hex');
    cb(null, `service-${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // strictly 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WEBP image files are allowed"), false);
    }
    cb(null, true);
  },
});


// 🔹 Helper: parse array fields
const parseArray = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  return field.split(",").map((f) => f.trim()).filter(Boolean);
};

const parseIncludes = (field) => {
  if (!field) return [];
  try {
    return typeof field === 'string' ? JSON.parse(field) : field;
  } catch (e) {
    return [];
  }
};


// 🔹 Helper: delete old image
const deleteImage = (imagePath) => {
  if (!imagePath) return;
  const fullPath = path.join(__dirname, "..", imagePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};


// ===============================
// 📦 GET ALL SERVICES
// ===============================
router.get("/", async (req, res) => {
  try {
    const { category, activeOnly, tenantId } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (activeOnly === "true") filter.isActive = true;

    // SaaS Filtering
    if (tenantId && tenantId !== 'all') {
      filter.adminId = tenantId;
    } else if (tenantId === 'all') {
      // Unified view: Return all services across all contexts
    } else {
      const superAdmin = await User.findOne({ role: "admin" }).lean();
      if (superAdmin) {
        filter.adminId = superAdmin._id;
      }
    }

    const services = await ServiceItem.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (err) {
    console.error("GET SERVICES ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===============================
// 🔄 SYNC CART ITEMS WITH DATABASE
// ===============================
router.post("/sync", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: "Invalid or missing IDs array" });
    }
    const services = await ServiceItem.find({ _id: { $in: ids } });
    res.json({ success: true, data: services });
  } catch (err) {
    console.error("SYNC SERVICES ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===============================
// 📊 CART RECOMMENDATIONS & ANALYTICS
// ===============================

// GET /api/services/featured-cart - Get active featured cart offerings (sorted by priority)
router.get("/featured-cart", async (req, res) => {
  try {
    const { tenantId } = req.query;
    const filter = { isActive: true, isFeaturedCart: true };
    
    // SaaS Filtering
    if (tenantId) {
      filter.adminId = tenantId;
    } else {
      const superAdmin = await User.findOne({ role: "admin" }).lean();
      if (superAdmin) {
        filter.adminId = superAdmin._id;
      }
    }

    let services = await ServiceItem.find(filter).sort({ cartPriority: -1, createdAt: -1 });

    // Fallback: If no featured cart items are configured in the DB yet,
    // return 3 default Bhog items as a dynamic placeholder/bootstrap.
    if (services.length === 0) {
      services = await ServiceItem.find({ category: 'Bhog', isActive: true }).limit(3);
    }

    res.json({
      success: true,
      data: services
    });
  } catch (err) {
    console.error("GET FEATURED CART ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/services/cart-analytics - Get cart analytics (most added items)
router.get("/cart-analytics", protect, admin, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin') {
      filter.adminId = req.effectiveId;
    }
    const analytics = await ServiceItem.find(filter)
      .select("title category price cartAddedCount isFeaturedCart cartPriority")
      .sort({ cartAddedCount: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      data: analytics
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/services/:id/track-cart-add - Track when a Bhog is added to cart
router.post("/:id/track-cart-add", async (req, res) => {
  try {
    const service = await ServiceItem.findByIdAndUpdate(
      req.params.id,
      { $inc: { cartAddedCount: 1 } },
      { new: true }
    );
    if (!service) {
      return res.status(404).json({ success: false, message: "Offering not found" });
    }
    res.json({ success: true, count: service.cartAddedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/services/:id/toggle-featured-cart - Admin toggle featured cart recommendation
router.put("/:id/toggle-featured-cart", protect, admin, async (req, res) => {
  try {
    const service = await ServiceItem.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Offering not found" });
    }
    
    // Authorization check
    if (req.user.role !== 'admin') {
      if (!service.adminId || service.adminId.toString() !== req.effectiveId.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }
    }

    const { isFeaturedCart, cartPriority } = req.body;
    if (isFeaturedCart !== undefined) service.isFeaturedCart = isFeaturedCart;
    if (cartPriority !== undefined) service.cartPriority = Number(cartPriority);

    await service.save();
    res.json({ success: true, message: "Recommendation settings updated", data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ===============================
// 📦 GET SINGLE SERVICE
// ===============================
router.get("/:id", async (req, res) => {
  try {
    const service = await ServiceItem.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    res.json({ success: true, data: service });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ===============================
// ➕ CREATE SERVICE
// ===============================
router.post("/", protect, admin, upload.single("image"), async (req, res) => {
  try {
    const data = req.body;

    // 🔥 Validation
    if (!data.title || !data.price || !data.category) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const newService = {
      ...data,
      adminId: (req.user.role === 'admin' && data.adminId) ? data.adminId : req.effectiveId,
      features: parseArray(data.features),
      benefits: parseArray(data.benefits),
      steps: parseArray(data.steps),
      includes: parseIncludes(data.includes),
      isActive: data.isActive === "true" || data.isActive === true,
      isFeaturedCart: data.isFeaturedCart === "true" || data.isFeaturedCart === true,
      cartPriority: Number(data.cartPriority) || 0,
    };

    if (req.file) {
      newService.imageUrl = `/uploads/${req.file.filename}`;
    }

    const service = await ServiceItem.create(newService);

    res.status(201).json({
      success: true,
      message: "Service created",
      data: service,
    });

  } catch (err) {
    console.error("CREATE SERVICE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// ===============================
// ✏️ UPDATE SERVICE
// ===============================
router.put("/:id", protect, admin, upload.single("image"), async (req, res) => {
  try {
    const service = await ServiceItem.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // SaaS: Ensure admin can only edit their own services (or their agent's parent admin services)
    if (req.user.role !== 'admin') {
      if (!service.adminId || service.adminId.toString() !== req.effectiveId.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }
    }

    const data = req.body;

    const updateData = {
      ...data,
    };

    if (data.features !== undefined) updateData.features = parseArray(data.features);
    if (data.benefits !== undefined) updateData.benefits = parseArray(data.benefits);
    if (data.steps !== undefined) updateData.steps = parseArray(data.steps);
    if (data.includes !== undefined) updateData.includes = parseIncludes(data.includes);

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive === "true" || data.isActive === true;
    }

    if (data.isFeaturedCart !== undefined) {
      updateData.isFeaturedCart = data.isFeaturedCart === "true" || data.isFeaturedCart === true;
    }

    if (data.cartPriority !== undefined) {
      updateData.cartPriority = Number(data.cartPriority) || 0;
    }

    // 🔥 Replace image
    if (req.file) {
      deleteImage(service.imageUrl);
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    Object.assign(service, updateData);

    const updated = await service.save();

    res.json({
      success: true,
      message: "Service updated",
      data: updated,
    });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// ===============================
// ❌ DELETE SERVICE
// ===============================
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    console.log(`[DELETE SERVICE] ID: ${req.params.id}, User: ${req.user?._id}, Effective: ${req.effectiveId}`);
    
    const service = await ServiceItem.findById(req.params.id);

    if (!service) {
      console.log(`[DELETE SERVICE] Failed: Service not found for ID ${req.params.id}`);
      return res.status(404).json({ message: "Service not found" });
    }

    // SaaS: Ensure admin can only delete their own services
    if (req.user.role !== 'admin') {
      if (!service.adminId || service.adminId.toString() !== req.effectiveId.toString()) {
        console.log(`[DELETE SERVICE] Unauthorized: Service Admin (${service.adminId}) vs User Effective (${req.effectiveId})`);
        return res.status(403).json({ message: "Not authorized to delete this service" });
      }
    }

    // 🔥 Delete image
    deleteImage(service.imageUrl);

    await service.deleteOne();
    console.log(`[DELETE SERVICE] Success: ID ${req.params.id}`);

    res.json({
      success: true,
      message: "Service deleted",
    });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;