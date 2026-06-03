const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/bookings - Create simple booking
router.post('/', validate(schemas.bookingCreate), asyncHandler(bookingController.createBooking));

// GET /api/bookings - Get all bookings (Admin/Tenant)
router.get('/', protect, asyncHandler(bookingController.getAllBookings));

// PUT /api/bookings/:id/status - Update booking status
router.put('/:id/status', protect, admin, validate(schemas.bookingUpdateStatus), asyncHandler(bookingController.updateStatus));

// POST /api/bookings/v2 - Create V2 booking (Multi-item support)
router.post('/v2', protect, validate(schemas.bookingCreateV2), asyncHandler(bookingController.createBookingV2));

module.exports = router;