const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/wallet/my-wallet - Get current user wallet details
router.get('/my-wallet', protect, asyncHandler(walletController.myWallet));

// GET /api/wallet/user-history/:userId - Get transaction history of specific user
router.get('/user-history/:userId', protect, asyncHandler(walletController.userHistory));

// GET /api/wallet/all-wallets - Get all user wallets (Admin only)
router.get('/all-wallets', protect, admin, asyncHandler(walletController.allWallets));

// GET /api/wallet/total-float - Get sum of all user wallets (Admin only)
router.get('/total-float', protect, admin, asyncHandler(walletController.totalFloat));

// POST /api/wallet/self-topup - Admin self topup/withdrawal
router.post('/self-topup', protect, admin, validate(schemas.walletSelfTopup), asyncHandler(walletController.selfTopup));

// POST /api/wallet/admin-adjustment - Admin adjust user wallet
router.post('/admin-adjustment', protect, admin, validate(schemas.walletAdminAdjustment), asyncHandler(walletController.adminAdjustment));

// POST /api/wallet/freeze - Admin freeze user wallet
router.post('/freeze', protect, admin, validate(schemas.walletFreeze), asyncHandler(walletController.freezeWallet));

// POST /api/wallet/unfreeze - Admin unfreeze user wallet
router.post('/unfreeze', protect, admin, validate(schemas.walletFreeze), asyncHandler(walletController.unfreezeWallet));

// GET /api/wallet/global-history - Admin ledger logs
router.get('/global-history', protect, admin, asyncHandler(walletController.globalHistory));

module.exports = router;
