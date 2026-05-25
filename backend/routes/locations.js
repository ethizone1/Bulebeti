const express = require('express');
const router = express.Router();
const Location = require('../models/Location');

// Get locations for a specific restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const locations = await Location.find({ restaurantId: req.params.restaurantId }).sort({ createdAt: 1 });
    res.json(locations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a new location
router.post('/', async (req, res) => {
  try {
    const newLocation = new Location(req.body);
    const location = await newLocation.save();
    res.json(location);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
