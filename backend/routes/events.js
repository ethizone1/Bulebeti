const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { canManageRestaurant } = require('../middleware/ownership');
const Event = require('../models/Event');

// Get events for a specific restaurant (Public)
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const events = await Event.find({ restaurantId: req.params.restaurantId }).sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    console.error('[GET EVENTS ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Add a new event (Requires Auth & Ownership)
router.post('/', auth, async (req, res) => {
  try {
    const { restaurantId } = req.body;
    const authorized = await canManageRestaurant(req.user.id, req.user.role, restaurantId);
    if (!authorized) {
      return res.status(403).json({ msg: 'Forbidden: You are not authorized for this restaurant' });
    }

    const newEvent = new Event(req.body);
    const event = await newEvent.save();
    res.json(event);
  } catch (err) {
    console.error('[ADD EVENT ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Update an event (Requires Auth & Ownership)
router.put('/:id', auth, async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    const authorized = await canManageRestaurant(req.user.id, req.user.role, event.restaurantId);
    if (!authorized) {
      return res.status(403).json({ msg: 'Forbidden: You are not authorized to update this event' });
    }

    event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(event);
  } catch (err) {
    console.error('[UPDATE EVENT ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Delete an event (Requires Auth & Ownership)
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    const authorized = await canManageRestaurant(req.user.id, req.user.role, event.restaurantId);
    if (!authorized) {
      return res.status(403).json({ msg: 'Forbidden: You are not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Event removed' });
  } catch (err) {
    console.error('[DELETE EVENT ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
