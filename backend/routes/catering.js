const express = require('express');
const router = express.Router();
const CateringRequest = require('../models/CateringRequest');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { notifyAdminAndCustomer, notifyStatusUpdate } = require('../services/notifications');

// Create a catering request
router.post('/', async (req, res) => {
  try {
    const { eventType, guestCount, date, location, name, email, phone, details, restaurantSlug } = req.body;
    
    let restaurantId = null;
    let adminEmail = 'admin@bulebet.com'; // Default fallback
    let adminPhone = 'N/A';
    let restaurantName = 'BuleBet Partners';
    
    if (restaurantSlug) {
      const restaurant = await Restaurant.findOne({ slug: restaurantSlug });
      if (restaurant) {
        restaurantId = restaurant._id;
        restaurantName = restaurant.name;
        const admin = await User.findById(restaurant.ownerId);
        if (admin) {
          adminEmail = admin.email;
          adminPhone = 'N/A';
        }
      }
    }

    const newRequest = new CateringRequest({
      eventType,
      guestCount,
      date,
      location,
      name,
      email,
      phone,
      details,
      restaurantId
    });

    const savedRequest = await newRequest.save();
    console.log(`[BACKEND] 🍽️ New Catering Request: ${name} (${email}) for ${eventType} on ${date}`);
    
    // Trigger Notification
    notifyAdminAndCustomer(
      adminEmail, 
      adminPhone, 
      email, 
      phone, 
      'Catering', 
      {
        restaurantName,
        eventType,
        date,
        location,
        guestCount,
        name,
        details
      }
    );
    
    res.json(savedRequest);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Get catering requests for a specific restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const requests = await CateringRequest.find({ restaurantId: req.params.restaurantId }).sort({ date: 1 });
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// PUT to update catering request status (Admin)
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;

    let cateringRequest = await CateringRequest.findById(req.params.id);
    if (!cateringRequest) {
      return res.status(404).json({ msg: 'Catering request not found' });
    }

    const previousStatus = cateringRequest.status;
    cateringRequest.status = status;
    await cateringRequest.save();

    // Fire notification only when status actually changed
    if (status !== previousStatus) {
      let restaurantName = 'BuleBet Partners';
      if (cateringRequest.restaurantId) {
        const restaurant = await Restaurant.findById(cateringRequest.restaurantId);
        if (restaurant) restaurantName = restaurant.name;
      }

      notifyStatusUpdate(
        'Catering',
        status,
        cateringRequest.email,
        cateringRequest.phone,
        {
          restaurantId:  cateringRequest.restaurantId,
          restaurantName,
          name:       cateringRequest.name,
          eventType:  cateringRequest.eventType,
          date:       cateringRequest.date ? new Date(cateringRequest.date).toLocaleDateString() : 'TBD',
          location:   cateringRequest.location,
          guestCount: cateringRequest.guestCount
        }
      );
    }

    res.json(cateringRequest);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

module.exports = router;
