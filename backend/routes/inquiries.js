const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const auth = require('../middleware/auth');
const { canManageRestaurant } = require('../middleware/ownership');
const Restaurant = require('../models/Restaurant');

// @route   POST /api/inquiries
// @desc    Submit a new inquiry (Public)
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message, restaurantId } = req.body;

    const newInquiry = new Inquiry({
      name,
      email,
      phone,
      subject,
      message,
      restaurantId: restaurantId || null
    });

    const savedInquiry = await newInquiry.save();
    res.status(201).json(savedInquiry);
  } catch (err) {
    console.error('Submit Inquiry Error:', err.message);
    res.status(500).json({ msg: 'Server error while submitting inquiry' });
  }
});

// @route   GET /api/inquiries
// @desc    Get all inquiries (Requires Admin Auth)
// @access  Private (Admin / Owner)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role === 'super-admin' || req.user.role === 'admin') {
      const inquiries = await Inquiry.find().sort({ createdAt: -1 });
      return res.json(inquiries);
    }

    // Filter inquiries by user's owned restaurants
    const myRestaurants = await Restaurant.find({
      $or: [{ ownerId: req.user.id }, { "admins.user": req.user.id }]
    });
    const restaurantIds = myRestaurants.map(r => r._id);

    const inquiries = await Inquiry.find({ restaurantId: { $in: restaurantIds } }).sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    console.error('Fetch Inquiries Error:', err.message);
    res.status(500).json({ msg: 'Server error while fetching inquiries' });
  }
});

// @route   PUT /api/inquiries/:id
// @desc    Update inquiry status (Requires Auth)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    let inquiry = await Inquiry.findById(req.params.id);
    
    if (!inquiry) return res.status(404).json({ msg: 'Inquiry not found' });

    const authorized = await canManageRestaurant(req.user.id, req.user.role, inquiry.restaurantId);
    if (!authorized) {
      return res.status(403).json({ msg: 'Forbidden: Access denied' });
    }

    if (status) inquiry.status = status;

    await inquiry.save();
    res.json(inquiry);
  } catch (err) {
    console.error('Update Inquiry Error:', err.message);
    res.status(500).json({ msg: 'Server error while updating inquiry' });
  }
});

module.exports = router;
