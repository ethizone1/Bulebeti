const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Gallery = require('../models/Gallery');
const Restaurant = require('../models/Restaurant');

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

// Get all gallery images for a specific restaurant (Public)
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const images = await Gallery.find({ restaurantId: req.params.restaurantId }).sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    console.error('[GET GALLERY ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Add a new gallery image (Requires Auth & Ownership)
router.post('/', auth, async (req, res) => {
  try {
    const { restaurantId, imageUrl, title, description } = req.body;

    const authorized = await canManageRestaurant(req.user.id, req.user.role, restaurantId);
    if (!authorized) {
      return res.status(403).json({ msg: 'Forbidden: You are not authorized for this restaurant' });
    }

    const newImage = new Gallery({ restaurantId, imageUrl, title, description });
    const image = await newImage.save();
    res.json(image);
  } catch (err) {
    console.error('[ADD GALLERY ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Delete a gallery image (Requires Auth & Ownership)
router.delete('/:id', auth, async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    if (!image) return res.status(404).json({ msg: 'Image not found' });
    
    const authorized = await canManageRestaurant(req.user.id, req.user.role, image.restaurantId);
    if (!authorized) {
      return res.status(403).json({ msg: 'Forbidden: You are not authorized to delete this image' });
    }

    await image.deleteOne();
    res.json({ msg: 'Image removed' });
  } catch (err) {
    console.error('[DELETE GALLERY ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Update a gallery image (Requires Auth & Ownership)
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, imageUrl } = req.body;
    
    let image = await Gallery.findById(req.params.id);
    if (!image) return res.status(404).json({ msg: 'Image not found' });

    const authorized = await canManageRestaurant(req.user.id, req.user.role, image.restaurantId);
    if (!authorized) {
      return res.status(403).json({ msg: 'Forbidden: You are not authorized to edit this image' });
    }

    image.title = title || image.title;
    image.description = description || image.description;
    image.imageUrl = imageUrl || image.imageUrl;

    await image.save();
    res.json(image);
  } catch (err) {
    console.error('[UPDATE GALLERY ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
