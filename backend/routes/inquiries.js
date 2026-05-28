const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const auth = require('../middleware/auth');

// @route   POST /api/inquiries
// @desc    Submit a new inquiry (Public or Authenticated)
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
    console.error('Submit Inquiry Error:', err);
    res.status(500).json({ msg: 'Server error while submitting inquiry' });
  }
});

// @route   GET /api/inquiries
// @desc    Get all inquiries (Super Admin)
// @access  Public (for demonstration, should ideally be authenticated super admin)
router.get('/', async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    console.error('Fetch Inquiries Error:', err);
    res.status(500).json({ msg: 'Server error while fetching inquiries' });
  }
});

// @route   PUT /api/inquiries/:id
// @desc    Update inquiry status
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    let inquiry = await Inquiry.findById(req.params.id);
    
    if (!inquiry) return res.status(404).json({ msg: 'Inquiry not found' });

    if (status) inquiry.status = status;

    await inquiry.save();
    res.json(inquiry);
  } catch (err) {
    console.error('Update Inquiry Error:', err);
    res.status(500).json({ msg: 'Server error while updating inquiry' });
  }
});

module.exports = router;
