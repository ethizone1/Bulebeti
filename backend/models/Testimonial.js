const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: { type: String, required: true },
  role: { type: String, default: 'Customer' },
  text: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  status: { type: String, enum: ['Approved', 'Pending', 'Rejected'], default: 'Approved' },
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ['image', 'video'] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
