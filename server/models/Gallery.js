const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: false
  },
  instagramUrl: {
    type: String,
    required: false
  },
  altText: {
    type: String,
    default: 'Gallery Item'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', GallerySchema);
