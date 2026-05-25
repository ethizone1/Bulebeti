const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Testimonial = require('../models/Testimonial');
const Restaurant = require('../models/Restaurant');

// Helper to get restaurant ID from slug or ID
const getRestaurantId = async (param) => {
  if (param.match(/^[0-9a-fA-F]{24}$/)) {
    return param;
  }
  const restaurant = await Restaurant.findOne({ slug: { $regex: new RegExp(`^${param}$`, 'i') } });
  return restaurant ? restaurant._id : null;
};

// GET approved testimonials for a restaurant
router.get('/restaurant/:identifier', async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.params.identifier);
    if (!restaurantId) {
      return res.status(404).json({ msg: 'Restaurant not found' });
    }
    const testimonials = await Testimonial.find({ restaurantId, status: 'Approved' }).sort({ createdAt: -1 });
    console.log(`[DEBUG] GET /testimonials/restaurant/${req.params.identifier} found ${testimonials.length} testimonials for ${restaurantId}`);
    res.json(testimonials);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// GET all testimonials for a restaurant (admin review)
router.get('/restaurant/:identifier/admin', async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.params.identifier);
    if (!restaurantId) {
      return res.status(404).json({ msg: 'Restaurant not found' });
    }
    const testimonials = await Testimonial.find({ restaurantId }).sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// POST submit a testimonial (public)
router.post('/restaurant/:identifier', async (req, res) => {
  const { name, role, text, rating, mediaUrl, mediaType } = req.body;
  try {
    const restaurantId = await getRestaurantId(req.params.identifier);
    if (!restaurantId) {
      return res.status(404).json({ msg: 'Restaurant not found' });
    }
    
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ msg: 'Restaurant not found' });
    }
    
    // Check if restaurant is Premium (bypassed for local development)
    // if (restaurant.subscriptionTier !== 'Premium') {
    //   return res.status(403).json({ msg: 'Testimonials feature is only available for Premium tier restaurants' });
    // }

    const newTestimonial = new Testimonial({
      restaurantId,
      name,
      role: role || 'Customer',
      text,
      rating: Number(rating) || 5,
      mediaUrl,
      mediaType,
      status: 'Approved'
    });

    const testimonial = await newTestimonial.save();
    res.json(testimonial);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// PUT update testimonial status
router.put('/:id', async (req, res) => {
  const { status, rating, text, name, role, mediaUrl, mediaType } = req.body;
  try {
    let testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }

    const updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (rating !== undefined) updateFields.rating = rating;
    if (text !== undefined) updateFields.text = text;
    if (name !== undefined) updateFields.name = name;
    if (role !== undefined) updateFields.role = role;
    if (mediaUrl !== undefined) updateFields.mediaUrl = mediaUrl;
    if (mediaType !== undefined) updateFields.mediaType = mediaType;

    testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    res.json(testimonial);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// DELETE a testimonial
router.delete('/:id', async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Testimonial removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

module.exports = router;
