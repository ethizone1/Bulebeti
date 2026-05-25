const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  customer: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  phone: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['New', 'Reviewed', 'Published', 'Action Needed', 'Flagged'],
    default: 'New'
  }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
