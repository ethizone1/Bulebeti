const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
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
    let adminEmail = "admin@bulebeti.com"; // Default fallback
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
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// GET all reservations for a specific restaurant by slug (For Admin Dashboard)
router.get("/restaurant/:restaurantSlug", async (req, res) => {
  try {
    // First find the restaurant ID
    const restaurant = await Restaurant.findOne({
      slug: req.params.restaurantSlug,
    });
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    const reservations = await Reservation.find({
      restaurantId: restaurant._id,
    }).sort({ date: 1, time: 1 });
    res.json(reservations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// PUT to update reservation status (Requires Auth)
router.put("/:id", auth, async (req, res) => {
  try {
    const { status } = req.body;

    let reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ msg: "Reservation not found" });
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
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
