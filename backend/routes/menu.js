const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRestaurantOwnership } = require('../middleware/ownership');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');

// Helper to check ownership of a restaurant ID
async function isAuthorizedForRestaurant(userId, userRole, restaurantId) {
  if (userRole === 'super-admin') return true;
  if (!restaurantId) return false;

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return false;

  const isOwner = restaurant.ownerId && restaurant.ownerId.toString() === userId;
  const isAdmin = restaurant.admins && restaurant.admins.some(a => a.user && a.user.toString() === userId);
  return isOwner || isAdmin;
}

// Get all menu items across all restaurants
router.get('/', async (req, res) => {
  try {
    const menuItems = await MenuItem.find().populate('restaurantId', 'name');
    res.json(menuItems);
  } catch (err) {
    console.error('[GET MENU ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Get menu for a restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ restaurantId: req.params.restaurantId });
    res.json(menuItems);
  } catch (err) {
    console.error('[GET RESTAURANT MENU ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Add menu item (requires auth & restaurant ownership)
router.post('/', auth, requireRestaurantOwnership, async (req, res) => {
  const { name, description, price, category, imageUrl, isAvailable, restaurantId, ingredients, contains } = req.body;

  try {
    const newMenuItem = new MenuItem({
      name,
      description,
      price,
      category,
      imageUrl,
      isAvailable,
      restaurantId,
      ingredients,
      contains
    });

    const menuItem = await newMenuItem.save();
    res.json(menuItem);
  } catch (err) {
    console.error('[ADD MENU ITEM ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Update menu item (requires auth & ownership check)
router.put('/:id', auth, async (req, res) => {
  const { name, description, price, category, imageUrl, isAvailable, ingredients, contains } = req.body;

  try {
    let menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ msg: 'Menu item not found' });
    }

    // Verify user owns or manages the target restaurant
    const authorized = await isAuthorizedForRestaurant(req.user.id, req.user.role, menuItem.restaurantId);
    if (!authorized) {
      return res.status(403).json({ msg: 'Forbidden: You do not have permission to modify this menu item' });
    }

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (price !== undefined) updateFields.price = price;
    if (category !== undefined) updateFields.category = category;
    if (imageUrl !== undefined) updateFields.imageUrl = imageUrl;
    if (isAvailable !== undefined) updateFields.isAvailable = isAvailable;
    if (ingredients !== undefined) updateFields.ingredients = ingredients;
    if (contains !== undefined) updateFields.contains = contains;

    menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    res.json(menuItem);
  } catch (err) {
    console.error('[UPDATE MENU ITEM ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Delete a menu item (requires auth & ownership check)
router.delete('/:id', auth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ msg: 'Menu item not found' });
    }

    // Verify user owns or manages the target restaurant
    const authorized = await isAuthorizedForRestaurant(req.user.id, req.user.role, menuItem.restaurantId);
    if (!authorized) {
      return res.status(403).json({ msg: 'Forbidden: You do not have permission to delete this menu item' });
    }

    await MenuItem.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Menu item removed', id: req.params.id });
  } catch (err) {
    console.error('[DELETE MENU ITEM ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
