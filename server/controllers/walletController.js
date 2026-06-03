const User = require('../models/User');
const Transaction = require('../models/Transaction');
const walletService = require('../services/walletService');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class WalletController {
  // GET /api/wallet/my-wallet
  async myWallet(req, res) {
    const user = await User.findById(req.user._id).lean();
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const history = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      balance: user.walletBalance || 0,
      walletFrozen: user.walletFrozen || false,
      history
    });
  }

  // GET /api/wallet/user-history/:userId
  async userHistory(req, res) {
    if (req.user.role === 'user' && req.user._id.toString() !== req.params.userId) {
      throw new ApiError(403, "Not authorized to view this history");
    }

    const history = await Transaction.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      history
    });
  }

  // GET /api/wallet/all-wallets
  async allWallets(req, res) {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, "Only admins can view all wallets");
    }

    const users = await User.find({ role: 'user' })
      .select('name mobile email walletBalance walletFrozen')
      .lean();

    res.json({
      success: true,
      users
    });
  }

  // GET /api/wallet/total-float
  async totalFloat(req, res) {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, "Only admins can view total float");
    }

    const total = await User.aggregate([
      { $match: { role: 'user' } },
      { $group: { _id: null, totalBalance: { $sum: "$walletBalance" } } }
    ]);

    res.json({
      success: true,
      total: total[0]?.totalBalance || 0
    });
  }

  // POST /api/wallet/self-topup
  async selfTopup(req, res) {
    try {
      if (req.user.role !== 'admin') {
        logger.error(`[selfTopup] Unauthorized attempt by user=${req.user?._id} with role=${req.user?.role}`);
        throw new ApiError(403, "Only admins can perform self top-up");
      }

      const { amount, type, description } = req.body;
      const desc = description || `Admin Self ${type || 'credit'}`;
      logger.info(`[selfTopup] Admin self-topup: adminId=${req.user._id}, amount=${amount}, type=${type}, desc=${desc}`);

      if (type === 'debit') {
        await walletService.debit(req.user._id, Number(amount), 'admin_self_topup', desc);
      } else {
        await walletService.credit(req.user._id, Number(amount), 'admin_self_topup', desc);
      }

      const adminUser = await User.findById(req.user._id).lean();
      logger.info(`[selfTopup] Admin balance updated: adminId=${req.user._id}, newBalance=${adminUser?.walletBalance}`);

      res.json({
        success: true,
        message: "Balance updated successfully",
        newBalance: adminUser?.walletBalance || 0
      });
    } catch (err) {
      logger.error(`[selfTopup] Exception: ${err.message}`);
      throw err;
    }
  }

  // POST /api/wallet/admin-adjustment
  async adminAdjustment(req, res) {
    const { userId, amount, type, description } = req.body;

    if (req.user.role !== 'admin') {
      throw new ApiError(403, "Only admins can perform wallet adjustments");
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      throw new ApiError(404, "User not found");
    }

    const adminId = req.user._id;

    if (type === 'credit') {
      // Admin credits User: Debit Admin wallet, Credit User wallet
      const descAdmin = `Transfer to devotee ${targetUser.name}`;
      const descUser = description || `Admin credit adjustment`;

      // Debit Admin
      await walletService.debit(adminId, Number(amount), 'admin_transfer', descAdmin);
      // Credit User
      await walletService.credit(userId, Number(amount), 'admin_adjustment', descUser, adminId);
    } else {
      // Admin debits User: Credit Admin wallet, Debit User wallet
      const descAdmin = `Transfer from devotee ${targetUser.name}`;
      const descUser = description || `Admin debit adjustment`;

      // Debit User
      await walletService.debit(userId, Number(amount), 'admin_adjustment', descUser, adminId);
      // Credit Admin
      await walletService.credit(adminId, Number(amount), 'admin_transfer', descAdmin, null);
    }

    const updatedUser = await User.findById(userId).lean();

    res.json({
      success: true,
      message: `Wallet ${type}ed successfully`,
      newBalance: updatedUser.walletBalance
    });
  }

  // GET /api/wallet/global-history
  async globalHistory(req, res) {
    try {
      if (req.user.role !== 'admin') {
        logger.error(`[globalHistory] Unauthorized access attempt by user=${req.user?._id} with role=${req.user?.role}`);
        throw new ApiError(403, "Only admins can view global wallet history");
      }

      logger.info(`[globalHistory] Admin fetching global wallet ledger logs`);
      const history = await Transaction.find({
        method: { $in: ['admin_adjustment', 'admin_transfer', 'admin_self_topup'] }
      })
        .populate('userId', 'name mobile role')
        .populate('targetUserId', 'name mobile role')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      // For self-topups, populate targetUserId with the admin user object (userId) if it is missing
      const processedHistory = (history || []).map(tx => {
        if (tx.method === 'admin_self_topup' && !tx.targetUserId) {
          tx.targetUserId = tx.userId;
        }
        return tx;
      });

      logger.info(`[globalHistory] Found ${processedHistory.length} ledger history entries`);

      res.json({
        success: true,
        history: processedHistory
      });
    } catch (err) {
      logger.error(`[globalHistory] Exception: ${err.message}`);
      throw err;
    }
  }

  // POST /api/wallet/freeze
  async freezeWallet(req, res) {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, "Only admins can freeze wallets");
    }
    const { userId } = req.body;
    const user = await User.findByIdAndUpdate(userId, { walletFrozen: true }, { new: true });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    global.io?.emit('walletFreezeStatus', { userId, walletFrozen: true });
    res.json({ success: true, message: "Wallet frozen successfully", user });
  }

  // POST /api/wallet/unfreeze
  async unfreezeWallet(req, res) {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, "Only admins can unfreeze wallets");
    }
    const { userId } = req.body;
    const user = await User.findByIdAndUpdate(userId, { walletFrozen: false }, { new: true });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    global.io?.emit('walletFreezeStatus', { userId, walletFrozen: false });
    res.json({ success: true, message: "Wallet unfrozen successfully", user });
  }
}

module.exports = new WalletController();
