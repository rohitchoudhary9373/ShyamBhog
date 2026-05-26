const BaseRepository = require('./baseRepository');
const User = require('../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByMobile(mobile) {
    return await this.model.findOne({ mobile }).select('+password');
  }

  async findByEmail(email) {
    return await this.model.findOne({ email }).select('+password');
  }
}

module.exports = new UserRepository();
