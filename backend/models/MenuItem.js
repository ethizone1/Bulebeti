const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String },
  categories: [{ type: String }],
  imageUrl: { type: String },
  isAvailable: { type: Boolean, default: true },
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant',
    required: true
  },
  ingredients: [
    {
      name: { type: String, required: true },
      checked: { type: Boolean, default: true }
    }
  ],
  contains: [
    {
      name: { type: String, required: true },
      checked: { type: Boolean, default: true }
    }
  ],
  createdAt: { type: Date, default: Date.now },
});

menuItemSchema.index({ restaurantId: 1 });
menuItemSchema.index({ category: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
