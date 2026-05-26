const BaseRepository = require('./baseRepository');
const Transaction = require('../models/Transaction');

class TransactionRepository extends BaseRepository {
  constructor() {
    super(Transaction);
  }

  async findUserTransactions(userId, limit = 50) {
    return await this.model.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('orderId')
      .lean();
  }

  async findByPaymentId(razorpayPaymentId) {
    return await this.model.findOne({ razorpayPaymentId }).lean();
  }
}

module.exports = new TransactionRepository();
