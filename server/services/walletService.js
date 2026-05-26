const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class WalletService {
  /**
   * Securely credit funds to a user's wallet.
   * @param {string} userId - ID of the user
   * @param {number} amount - Amount to credit
   * @param {string} method - 'razorpay' | 'wallet' | 'admin_adjustment' | 'admin_transfer' | 'admin_self_topup'
   * @param {string} description - Transaction description
   * @param {string} [adminId] - Admin performing the action (if applicable)
   * @param {string} [referenceTransactionId] - Parent reference transaction
   * @returns {Promise<object>} Created transaction object
   */
  async credit(userId, amount, method, description, adminId = null, referenceTransactionId = null, bypassFreeze = false) {
    if (amount <= 0) {
      throw new ApiError(400, 'Credit amount must be greater than zero');
    }

    const shouldBypass = bypassFreeze || ['admin_adjustment', 'admin_transfer', 'admin_self_topup'].includes(method);

    // Atomically increment the wallet balance if not frozen (or if bypassing)
    const matchCriteria = { _id: userId };
    if (!shouldBypass) {
      matchCriteria.walletFrozen = { $ne: true };
    }

    const oldUser = await User.findOneAndUpdate(
      matchCriteria,
      { $inc: { walletBalance: amount } },
      { new: false }
    );

    if (!oldUser) {
      const userCheck = await User.findById(userId);
      if (!userCheck) {
        throw new ApiError(404, 'User not found');
      }
      if (userCheck.walletFrozen && !shouldBypass) {
        throw new ApiError(400, 'Wallet is frozen and cannot be credited');
      }
      throw new ApiError(400, 'Could not credit wallet');
    }

    const openingBalance = oldUser.walletBalance || 0;
    const closingBalance = openingBalance + amount;

    logger.info(`Crediting Wallet: User ${userId} | Amt: ${amount} | Open: ${openingBalance} | Close: ${closingBalance}`);

    // Create the ledger transaction log
    const transaction = await Transaction.create({
      userId,
      adminId,
      amount,
      openingBalance,
      closingBalance,
      type: 'credit',
      method,
      status: 'success',
      description,
      referenceTransactionId
    });

    // Real-time socket broadcast
    global.io?.emit('walletUpdate', {
      userId,
      amount,
      type: 'credit',
      method,
      newBalance: closingBalance,
      transactionId: transaction._id
    });

    return transaction;
  }

  /**
   * Securely debit funds from a user's wallet.
   * @param {string} userId - ID of the user
   * @param {number} amount - Amount to debit
   * @param {string} method - 'wallet' | 'admin_adjustment' | 'admin_transfer'
   * @param {string} description - Transaction description
   * @param {string} [adminId] - Admin performing the action (if applicable)
   * @param {string} [referenceTransactionId] - Parent reference transaction
   * @param {boolean} [bypassFreeze] - True to bypass the frozen wallet check
   * @returns {Promise<object>} Created transaction object
   */
  async debit(userId, amount, method, description, adminId = null, referenceTransactionId = null, bypassFreeze = false) {
    if (amount <= 0) {
      throw new ApiError(400, 'Debit amount must be greater than zero');
    }

    const shouldBypass = bypassFreeze || ['admin_adjustment', 'admin_transfer', 'admin_self_topup'].includes(method);

    // Atomically decrement if and only if they have sufficient balance and wallet is not frozen (unless bypassing)
    const matchCriteria = { _id: userId, walletBalance: { $gte: amount } };
    if (!shouldBypass) {
      matchCriteria.walletFrozen = { $ne: true };
    }

    const oldUser = await User.findOneAndUpdate(
      matchCriteria,
      { $inc: { walletBalance: -amount } },
      { new: false }
    );

    if (!oldUser) {
      const userCheck = await User.findById(userId);
      if (!userCheck) {
        throw new ApiError(404, 'User not found');
      }
      if (userCheck.walletFrozen && !shouldBypass) {
        throw new ApiError(400, 'Wallet is frozen and cannot be debited');
      }
      if (userCheck.walletBalance < amount) {
        throw new ApiError(400, `Insufficient wallet balance. Required: ₹${amount}, current: ₹${userCheck.walletBalance || 0}`);
      }
      throw new ApiError(400, 'Could not debit wallet');
    }

    const openingBalance = oldUser.walletBalance || 0;
    const closingBalance = openingBalance - amount;

    logger.info(`Debiting Wallet: User ${userId} | Amt: ${amount} | Open: ${openingBalance} | Close: ${closingBalance}`);

    // Create the ledger transaction log
    const transaction = await Transaction.create({
      userId,
      adminId,
      amount,
      openingBalance,
      closingBalance,
      type: 'debit',
      method,
      status: 'success',
      description,
      referenceTransactionId
    });

    // Real-time socket broadcast
    global.io?.emit('walletUpdate', {
      userId,
      amount,
      type: 'debit',
      method,
      newBalance: closingBalance,
      transactionId: transaction._id
    });

    return transaction;
  }
}

module.exports = new WalletService();
