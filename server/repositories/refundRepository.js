const BaseRepository = require('./baseRepository');
const Refund = require('../models/Refund');

class RefundRepository extends BaseRepository {
  constructor() {
    super(Refund);
  }

  async findByOrderId(orderId) {
    return await this.model.findOne({ orderId }).populate('orderId userId').lean();
  }
}

module.exports = new RefundRepository();
