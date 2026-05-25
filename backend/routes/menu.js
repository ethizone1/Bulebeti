const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MenuItem = require('../models/MenuItem');

// Get all menu items across all restaurants
router.get('/', async (req, res) => {
  try {
    const menuItems = await MenuItem.find().populate('restaurantId', 'name');
    res.json(menuItems);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', details: err.message });
  }
});

// Get menu for a restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ restaurantId: req.params.restaurantId });
    res.json(menuItems);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', details: err.message });
  }
});

// Add menu item (requires auth)
router.post('/', auth, async (req, res) => {
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
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update menu item
router.put('/:id', auth, async (req, res) => {
  const { name, description, price, category, imageUrl, isAvailable, ingredients, contains } = req.body;

  try {
    let menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ msg: 'Menu item not found' });
    }

    // You would normally check if the user has permission to update this restaurant's menu here

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
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a menu item from THIS restaurant only
// (Each item is a separate document tied to restaurantId — deleting it never affects global menu or other restaurants)
router.delete('/:id', auth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ msg: 'Menu item not found' });
    }

    await MenuItem.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Menu item removed from your restaurant', id: req.params.id });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', details: err.message });
  }
});

module.exports = router;
