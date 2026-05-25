const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Change Password
router.post('/change-password', async (req, res) => {
  try {
    const { email, phone, oldPassword, newPassword } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Account not found with this email' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.status = 'active';
    await user.save();

    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await user.save();
    console.log(`[BACKEND] ✅ New user registered: ${name} (${email}) - Role: ${role}`);

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET || 'bulebet_super_secret_jwt_key_2024', { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    const requiresPasswordChange = (password === 'Admin.123');

    const Restaurant = require('../models/Restaurant');
    const restaurant = await Restaurant.findOne({ ownerId: user.id });
    
    // Check if they are an admin
    const adminOf = await Restaurant.findOne({ 'admins.user': user.id });

    let slug = restaurant ? restaurant.slug : (adminOf ? adminOf.slug : null);

    jwt.sign(payload, process.env.JWT_SECRET || 'bulebet_super_secret_jwt_key_2024', { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ 
        token, 
        user: { id: user.id, name: user.name, email: user.email, role: user.role }, 
        restaurantSlug: slug,
        requiresPasswordChange
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Change Password
const auth = require('../middleware/auth');
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    console.log(`[BACKEND] 🔑 Password updated for user: ${user.name} (${user.email})`);
    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

module.exports = router;
