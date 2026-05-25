const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');
const Restaurant = require('../models/Restaurant');

// Get all gallery images for a specific restaurant by restaurantId
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const images = await Gallery.find({ restaurantId: req.params.restaurantId }).sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a new gallery image
router.post('/', async (req, res) => {
  try {
    const { restaurantId, imageUrl, title, description } = req.body;
    const newImage = new Gallery({ restaurantId, imageUrl, title, description });
    const image = await newImage.save();
    res.json(image);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a gallery image
router.delete('/:id', async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    if (!image) return res.status(404).json({ msg: 'Image not found' });
    
    await image.deleteOne();
    res.json({ msg: 'Image removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a gallery image
router.put('/:id', async (req, res) => {
  try {
    const { title, description, imageUrl } = req.body;
    
    let image = await Gallery.findById(req.params.id);
    if (!image) return res.status(404).json({ msg: 'Image not found' });

    image.title = title || image.title;
    image.description = description || image.description;
    image.imageUrl = imageUrl || image.imageUrl;

    await image.save();
    res.json(image);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
