const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const ApiError = require('../utils/ApiError');

// 1. Rate Limiters with Production Safeguards
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests from this IP, please try again after 15 minutes'));
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 auth attempts per 15 mins (prevents brute force)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many authentication attempts from this IP, please try again after 15 minutes'));
  }
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit payment attempts to prevent payment spam
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many payment requests from this IP, please try again after 15 minutes'));
  }
});

// 2. Strict NoSQL Operator & MongoDB Injection Sanitizer
const sanitizeValue = (val) => {
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') {
    // Strip script tags for XSS protection
    return val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.map(sanitizeValue);
    }
    const cleanObj = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        // Strip keys starting with $ or containing . (MongoDB injection vectors)
        if (!key.startsWith('$') && !key.includes('.')) {
          cleanObj[key] = sanitizeValue(val[key]);
        }
      }
    }
    return cleanObj;
  }
  return val;
};

const nosqlSanitizer = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
};

// 3. Security Headers Config (Helmet)
const helmetConfig = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  xssFilter: true,
  noSniff: true,
  frameguard: { action: "sameorigin" },
  hidePoweredBy: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
});

module.exports = {
  generalLimiter,
  authLimiter,
  paymentLimiter,
  nosqlSanitizer,
  helmetConfig
};
