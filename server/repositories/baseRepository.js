class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async find(filter = {}, populate = '', sort = { createdAt: -1 }) {
    return await this.model.find(filter).populate(populate).sort(sort).lean();
  }

  async findOne(filter = {}, populate = '') {
    return await this.model.findOne(filter).populate(populate).lean();
  }

  async findById(id, populate = '') {
    return await this.model.findById(id).populate(populate).lean();
  }

  async create(data) {
    return await this.model.create(data);
  }

  async update(id, data, options = { new: true }) {
    return await this.model.findByIdAndUpdate(id, data, options);
  }

  async updateOne(filter, data, options = {}) {
    return await this.model.updateOne(filter, data, options);
  }

  async delete(id) {
    return await this.model.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return await this.model.countDocuments(filter);
  }

  async paginate(filter = {}, page = 1, limit = 10, populate = '', sort = { createdAt: -1 }) {
    const skip = (page - 1) * limit;
    const items = await this.model.find(filter)
      .populate(populate)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await this.model.countDocuments(filter);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}

module.exports = BaseRepository;
