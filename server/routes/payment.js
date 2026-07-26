const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');
const { paymentLimiter } = require('../middleware/security');
const asyncHandler = require('../utils/asyncHandler');

// Apply payment rate limiter to client-facing routes
router.post('/create-order', paymentLimiter, validate(schemas.paymentCreateOrder), asyncHandler(paymentController.createOrder));
router.post('/create-subscription', paymentLimiter, validate(schemas.paymentCreateSubscription), asyncHandler(paymentController.createSubscription));
router.post('/verify', protect, paymentLimiter, validate(schemas.paymentVerify), asyncHandler(paymentController.verifyPayment));
router.post('/verify-hybrid', protect, paymentLimiter, validate(schemas.paymentVerifyHybrid), asyncHandler(paymentController.verifyHybrid));
router.post('/pay-with-wallet-v2', protect, paymentLimiter, validate(schemas.paymentPayWithWalletV2), asyncHandler(paymentController.payWithWalletV2));
router.post('/record-failure', protect, validate(schemas.paymentRecordFailure), asyncHandler(paymentController.recordFailure));

// Razorpay Webhook endpoint (No auth, no rate limit)
router.post('/webhook', asyncHandler(paymentController.webhook));

module.exports = router;