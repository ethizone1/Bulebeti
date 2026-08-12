const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: false },
  googleId: { type: String, unique: true, sparse: true },
  picture: { type: String },
  role: { 
    type: String, 
    enum: ['customer', 'admin', 'sub-admin', 'super-admin'], 
    default: 'customer' 
  },
  status: {
    type: String,
    enum: ['active', 'pending'],
    default: 'pending'
  },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant',
  },
  createdAt: { type: Date, default: Date.now },
});

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
