const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { canManageRestaurant } = require("../middleware/ownership");
const Reservation = require("../models/Reservation");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const {
  notifyAdminAndCustomer,
  notifyStatusUpdate,
} = require("../services/notifications");

// POST a new reservation (Public)
router.post("/", async (req, res) => {
  try {
    const {
      restaurantId,
      guestName,
      email,
      phone,
      date,
      time,
      guests,
      specialRequests,
    } = req.body;

    const newReservation = new Reservation({
      restaurantId,
      guestName,
      email,
      phone,
      date,
      time,
      guests,
      specialRequests,
    });

    const reservation = await newReservation.save();

    // Find restaurant and admin for notifications
    const restaurant = await Restaurant.findById(restaurantId);
    let adminEmail = "admin@bulebeti.com";
    let adminPhone = "N/A";
    if (restaurant) {
      const admin = await User.findById(restaurant.ownerId);
      if (admin) {
        adminEmail = admin.email;
        adminPhone = admin.phone || "N/A";
      }
    }

    // Trigger Notification
    notifyAdminAndCustomer(
      adminEmail,
      adminPhone,
      email,
      phone,
      "Reservation",
      {
        restaurantName: restaurant ? restaurant.name : "bulebeti Partner",
        guestName,
        date,
        time,
        guests,
        specialRequests,
      },
    );

    res.json(reservation);
  } catch (err) {
    console.error("[RESERVATION POST ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET all reservations for a specific restaurant by slug (Requires Auth & Ownership)
router.get("/restaurant/:restaurantSlug", auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      slug: req.params.restaurantSlug,
    });
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    const authorized = await canManageRestaurant(req.user.id, req.user.role, restaurant._id);
    if (!authorized) {
      return res.status(403).json({ msg: "Forbidden: You are not authorized for this restaurant's reservations" });
    }

    const reservations = await Reservation.find({
      restaurantId: restaurant._id,
    }).sort({ date: 1, time: 1 });
    res.json(reservations);
  } catch (err) {
    console.error("[RESERVATION GET ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// PUT to update reservation status (Requires Auth & Ownership)
router.put("/:id", auth, async (req, res) => {
  try {
    const { status } = req.body;

    let reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ msg: "Reservation not found" });
    }

    const authorized = await canManageRestaurant(req.user.id, req.user.role, reservation.restaurantId);
    if (!authorized) {
      return res.status(403).json({ msg: "Forbidden: Access denied" });
    }

    const previousStatus = reservation.status;
    reservation.status = status;
    await reservation.save();

    // Fire notification only when status actually changed
    if (status !== previousStatus) {
      const restaurant = await Restaurant.findById(reservation.restaurantId);
      notifyStatusUpdate(
        "Reservation",
        status,
        reservation.email,
        reservation.phone,
        {
          restaurantId: reservation.restaurantId,
          restaurantName: restaurant ? restaurant.name : "bulebeti Partner",
          guestName: reservation.guestName,
          date: reservation.date,
          time: reservation.time,
          guests: reservation.guests,
          specialRequests: reservation.specialRequests,
        },
      );
    }

    res.json(reservation);
  } catch (err) {
    console.error("[RESERVATION PUT ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
