const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  themeColors: {
    primary: { type: String, default: '#D4AF37' },
    secondary: { type: String, default: '#1f2937' }
  },
  logoUrl: { type: String },
  bannerUrl: { type: String },
  openingHours: {
    weekdays: { type: String, default: '' },
    weekends: { type: String, default: '' },
  },
  socialLinks: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    youtube: { type: String, default: '' },
    tiktok: { type: String, default: '' },
    pinterest: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    telegram: { type: String, default: '' },
    snapchat: { type: String, default: '' },
  },
  menuLayout: { 
    type: String, 
    enum: ['image-left', 'image-right', 'image-top', 'image-bottom', 'text-centered'],
    default: 'image-left' 
  },
  subscriptionTier: {
    type: String,
    enum: ['Basic', 'Premium', 'Platinum', 'Silver', 'Gold'],
    default: 'Basic'
  },
  pendingTierRequest: {
    type: String,
    enum: ['', 'Silver', 'Gold', 'Platinum', 'Premium'],
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending'],
    default: 'Active'
  },
  admins: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    permissions: [{ type: String }]
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
