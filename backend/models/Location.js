const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'Coming Soon', 'Closed'],
    default: 'Open'
  }
}, { timestamps: true });

module.exports = mongoose.model('Location', LocationSchema);
