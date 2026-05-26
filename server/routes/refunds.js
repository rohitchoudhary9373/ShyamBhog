const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refundController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/refunds/request - Devotee request refund
router.post('/request', protect, validate(schemas.refundRequest), asyncHandler(refundController.requestRefund));

// GET /api/refunds/my - Get current devotee refund requests
router.get('/my', protect, asyncHandler(refundController.getMyRefunds));

// GET /api/refunds/admin - Get all refund requests (Admin/Tenant)
router.get('/admin', protect, admin, asyncHandler(refundController.getAdminRefunds));

// PUT /api/refunds/process/:id - Admin approve/reject refund request
router.put('/process/:id', protect, admin, validate(schemas.refundProcess), asyncHandler(refundController.processRefund));

module.exports = router;
