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

// Helper to check ownership
async function canManageRestaurant(userId, userRole, restaurantId) {
  if (userRole === 'super-admin') return true;
  if (!restaurantId) return false;
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return false;
  const isOwner = restaurant.ownerId && restaurant.ownerId.toString() === userId;
  const isAdmin = restaurant.admins && restaurant.admins.some(a => a.user && a.user.toString() === userId);
  return isOwner || isAdmin;
}

// GET approved testimonials for a restaurant (Public)
router.get('/restaurant/:identifier', async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.params.identifier);
    if (!restaurantId) {
      return res.status(404).json({ msg: 'Restaurant not found' });
    }
    const testimonials = await Testimonial.find({ restaurantId, status: 'Approved' }).sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    console.error('[GET TESTIMONIALS ERROR]', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET all testimonials for a restaurant (Requires Auth & Ownership)
router.get('/restaurant/:identifier/admin', auth, async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.params.identifier);
    if (!restaurantId) {
      return res.status(404).json({ msg: 'Restaurant not found' });
    }

    const authorized = await canManageRestaurant(req.user.id, req.user.role, restaurantId);
    if (!authorized) {
      return res.status(403).json({ msg: 'Forbidden: Access denied' });
    }

    const testimonials = await Testimonial.find({ restaurantId }).sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    console.error('[GET ADMIN TESTIMONIALS ERROR]', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST submit a testimonial (Public)
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
    console.error('[POST TESTIMONIAL ERROR]', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT update testimonial status (Requires Auth & Ownership)
router.put('/:id', auth, async (req, res) => {
  const { status, rating, text, name, role, mediaUrl, mediaType } = req.body;
  try {
    let testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }

    const authorized = await canManageRestaurant(req.user.id, req.user.role, testimonial.restaurantId);
    if (!authorized) {
      return res.status(403).json({ msg: 'Forbidden: Access denied' });
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
    console.error('[PUT TESTIMONIAL ERROR]', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE a testimonial (Requires Auth & Ownership)
router.delete('/:id', auth, async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }

    const authorized = await canManageRestaurant(req.user.id, req.user.role, testimonial.restaurantId);
    if (!authorized) {
      return res.status(403).json({ msg: 'Forbidden: Access denied' });
    }

    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Testimonial removed' });
  } catch (err) {
    console.error('[DELETE TESTIMONIAL ERROR]', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
