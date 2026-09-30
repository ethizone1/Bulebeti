const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkUserId: { type: String, sparse: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: false },
  googleId: { type: String, sparse: true },
  picture: { type: String },
  role: { 
    type: String, 
    enum: ['customer', 'admin', 'sub-admin', 'super-admin'], 
    default: 'customer' 
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended', 'inactive'],
    default: 'pending'
  },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
  verificationAttempts: { type: Number, default: 0 },
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant',
  },
  createdAt: { type: Date, default: Date.now },
});

userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
