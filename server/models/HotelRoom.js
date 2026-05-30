const mongoose = require('mongoose');

const HotelRoomSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  name: {
    type: String, // e.g. "Presidential Suite"
    required: true
  },
  category: {
    type: String, // e.g. "Suite", "Deluxe", "Standard", "Dormitory", "Family"
    required: true
  },
  description: {
    type: String
  },
  basePrice: {
    type: Number,
    required: true
  },
  maxGuests: {
    type: Number,
    default: 2
  },
  totalInventory: {
    type: Number, // Number of physical rooms of this type
    default: 1
  },
  amenities: [String],
  images: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('HotelRoom', HotelRoomSchema);
