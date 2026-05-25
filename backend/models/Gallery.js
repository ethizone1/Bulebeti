const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', GallerySchema);
