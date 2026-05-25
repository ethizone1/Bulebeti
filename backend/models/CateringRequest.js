const mongoose = require('mongoose');

const cateringRequestSchema = new mongoose.Schema({
  eventType: { type: String, required: true },
  guestCount: { type: Number, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  details: { type: String },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CateringRequest', cateringRequestSchema);
