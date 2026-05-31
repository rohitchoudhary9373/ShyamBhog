const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 🔐 PROTECT ROUTE (Login required)
const protect = async (req, res, next) => {
  try {
    let token;

    // ✅ Check header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Attach user to request
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status === 'blocked') {
       return res.status(403).json({
         success: false,
         message: "Account blocked",
       });
    }

    // ✅ Set effective ID for multi-tenant data fetching
    // If agent, their data context is their parent admin's ID
    req.effectiveId = user.role === 'agent' ? user.parentAdmin : user._id;

    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};


// 🔐 SUPER ADMIN CHECK
const superAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied (Super Admin only)",
    });
  }
};

// 🔐 ADMIN CHECK (Allows Resellers, Super Admins, and Agents)
const admin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "agent")) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied (Admin only)",
    });
  }
};

// 🔐 HOTEL OWNER CHECK (Deactivated)
const hotelOwner = (req, res, next) => {
  return res.status(403).json({
    success: false,
    message: "Access denied (Hotel Owner feature is inactive)",
  });
};

// 🔐 OPTIONAL: ROLE BASED ACCESS (ADVANCED)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user.role}) not allowed`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  admin,
  superAdmin,
  hotelOwner,
  authorizeRoles, // optional
};