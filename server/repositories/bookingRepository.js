const BaseRepository = require('./baseRepository');
const ArjeeOrder = require('../models/ArjeeOrder');

class BookingRepository extends BaseRepository {
  constructor() {
    super(ArjeeOrder);
  }

  async countBookingsForSlot(serviceId, slotDate) {
    const startOfDay = new Date(slotDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(slotDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Sum the quantity of this service booked for the date range
    const result = await this.model.aggregate([
      {
        $match: {
          status: { $nin: ['Cancelled', 'Failed'] },
          'items.serviceId': serviceId,
          'items.slot': { $gte: startOfDay, $lte: endOfDay }
        }
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.serviceId': serviceId,
          'items.slot': { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          totalBooked: { $sum: '$items.quantity' }
        }
      }
    ]);

    return result[0]?.totalBooked || 0;
  }

  async findByInvoiceNumber(invoiceNumber) {
    return await this.model.findOne({ invoiceNumber }).populate('userId adminId').lean();
  }
}

module.exports = new BookingRepository();
