const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Middleware to check if user is Owner or Manager
const verifyOwnerOrManager = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug });
    if (!restaurant) {
      return res.status(404).json({ msg: 'Restaurant not found' });
    }

    const isOwner = restaurant.ownerId.toString() === req.user.id;
    const adminRecord = restaurant.admins.find(a => a.user.toString() === req.user.id);
    const canManageTeam = adminRecord && adminRecord.permissions && adminRecord.permissions.includes('manage_team');
    const isSuperAdmin = req.user.role === 'super-admin' || req.user.role === 'hub owner';

    if (!isOwner && !canManageTeam && !isSuperAdmin) {
      return res.status(403).json({ msg: 'Only the restaurant owner, an authorized admin, or a super-admin can perform this action' });
    }

    req.restaurant = restaurant; // pass down
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// GET all admins for a restaurant
router.get('/:slug/team', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug })
      .populate('ownerId', 'name email')
      .populate('admins.user', 'name email');

    if (!restaurant) {
      return res.status(404).json({ msg: 'Restaurant not found' });
    }

    // Check basic access (Owner or any Admin)
    const isOwner = restaurant.ownerId._id.toString() === req.user.id;
    const isAdmin = restaurant.admins.some(a => a.user._id.toString() === req.user.id);
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json({
      owner: restaurant.ownerId,
      admins: restaurant.admins,
      subscriptionTier: restaurant.subscriptionTier
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST add a new admin
router.post('/:slug/team', auth, verifyOwnerOrManager, async (req, res) => {
  const { email, phone, permissions } = req.body;
  const restaurant = req.restaurant;

  try {
    let targetUser = await User.findOne({ email });
    if (!targetUser) {
      if (!phone) {
        return res.status(400).json({ msg: 'Phone number is required to invite a new user.' });
      }
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin.123', salt);

      targetUser = new User({
        name: 'Pending Admin',
        email,
        phone,
        password: hashedPassword,
        role: 'sub-admin',
        status: 'active'
      });
      await targetUser.save();
      
      // Simulate sending Email and SMS
      console.log(`\n===========================================`);
      console.log(`[MOCK EMAIL/SMS DISPATCH]`);
      console.log(`To: ${email} | Phone: ${phone}`);
      console.log(`Subject: You have been invited to manage ${restaurant.name}`);
      console.log(`Message: You have been added as a sub-admin.`);
      console.log(`Your login email/phone: ${email || phone}`);
      console.log(`Your default password: Admin.123`);
      console.log(`Please login and change your password immediately at: http://localhost:5173/activate`);
      console.log(`===========================================\n`);
    }

    if (restaurant.ownerId.toString() === targetUser._id.toString()) {
      return res.status(400).json({ msg: 'Cannot add the owner as an admin.' });
    }

    const alreadyAdmin = restaurant.admins.find(a => a.user.toString() === targetUser._id.toString());
    if (alreadyAdmin) {
      return res.status(400).json({ msg: 'User is already an admin.' });
    }

    // Check tier limits
    const currentTier = restaurant.subscriptionTier === 'Basic' ? 'Silver' : (restaurant.subscriptionTier || 'Platinum');
    let maxTeam = 0;
    if (currentTier === 'Gold') maxTeam = 2;
    if (currentTier === 'Platinum') maxTeam = 4;
    if (currentTier === 'Premium') maxTeam = 999; 

    if (restaurant.admins.length >= maxTeam) {
      return res.status(403).json({ 
        msg: `You have reached the maximum number of team members (${maxTeam}) for your ${currentTier} plan. Please upgrade to add more.` 
      });
    }

    restaurant.admins.push({ user: targetUser._id, permissions: permissions || [] });
    await restaurant.save();

    res.json(restaurant.admins);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT update admin permissions
router.put('/:slug/team/:userId', auth, verifyOwnerOrManager, async (req, res) => {
  const { permissions } = req.body;
  const restaurant = req.restaurant;

  try {
    const adminIndex = restaurant.admins.findIndex(a => a.user.toString() === req.params.userId);
    if (adminIndex === -1) {
      return res.status(404).json({ msg: 'Admin not found in this restaurant.' });
    }

    restaurant.admins[adminIndex].permissions = permissions;
    await restaurant.save();

    res.json(restaurant.admins);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT update admin profile details (name, email, phone)
router.put('/:slug/team/:userId/profile', auth, verifyOwnerOrManager, async (req, res) => {
  const { name, email, phone } = req.body;
  const restaurant = req.restaurant;

  try {
    const adminIndex = restaurant.admins.findIndex(a => a.user.toString() === req.params.userId);
    if (adminIndex === -1) {
      return res.status(404).json({ msg: 'Admin not found in this restaurant.' });
    }

    // Check if new email is taken by another user
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.params.userId) {
        return res.status(400).json({ msg: 'This email is already in use by another user.' });
      }
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ msg: 'User document not found.' });
    }

    if (name) targetUser.name = name;
    if (email) targetUser.email = email;
    if (phone !== undefined) targetUser.phone = phone; // Allow clearing phone

    await targetUser.save();

    res.json({ msg: 'Admin profile updated successfully', user: { id: targetUser._id, name: targetUser.name, email: targetUser.email, phone: targetUser.phone } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE remove an admin
router.delete('/:slug/team/:userId', auth, verifyOwnerOrManager, async (req, res) => {
  const restaurant = req.restaurant;

  try {
    restaurant.admins = restaurant.admins.filter(a => a.user.toString() !== req.params.userId);
    await restaurant.save();

    res.json(restaurant.admins);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
