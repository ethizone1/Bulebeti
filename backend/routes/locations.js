const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Location = require('../models/Location');
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

// Get locations for a specific restaurant (Public)
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const locations = await Location.find({ restaurantId: req.params.restaurantId }).sort({ createdAt: 1 });
    res.json(locations);
  } catch (err) {
    console.error('[GET LOCATIONS ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Add a new location (Requires Auth & Ownership)
router.post('/', auth, async (req, res) => {
  try {
    const { restaurantId } = req.body;
    const authorized = await canManageRestaurant(req.user.id, req.user.role, restaurantId);
    if (!authorized) {
      return res.status(403).json({ msg: 'Forbidden: Access denied' });
    }

    const newLocation = new Location(req.body);
    const location = await newLocation.save();
    res.json(location);
  } catch (err) {
    console.error('[POST LOCATION ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
