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

    // Find restaurant by ID or slug
    let restaurant = null;
    if (restaurantId) {
      if (restaurantId.match(/^[0-9a-fA-F]{24}$/)) {
        restaurant = await Restaurant.findById(restaurantId);
      } else {
        restaurant = await Restaurant.findOne({ slug: restaurantId });
      }
    }
    
    let adminEmail = "ethizone1@gmail.com";
    let adminPhone = "+12404411075";
    if (restaurant) {
      const admin = await User.findById(restaurant.ownerId);
      if (admin) {
        adminEmail = admin.email || restaurant.email || "ethizone1@gmail.com";
        adminPhone = admin.phone || restaurant.phone || "+12404411075";
      } else if (restaurant.email) {
        adminEmail = restaurant.email;
        adminPhone = restaurant.phone || "+12404411075";
      }
    }

    const isOrder = specialRequests && specialRequests.toUpperCase().includes("ONLINE ORDER");
    const type = isOrder ? "Order" : "Reservation";

    const itemsSummary = specialRequests ? specialRequests : "Menu Items";
    const totalPrice = (specialRequests && specialRequests.includes("Total: $")) 
      ? specialRequests.split("Total: $")[1].split(". ")[0] 
      : "0.00";
    const orderType = (specialRequests && specialRequests.includes("ONLINE ORDER ("))
      ? specialRequests.split("ONLINE ORDER (")[1].split(")")[0]
      : "Online Order";

    // Trigger Notification
    notifyAdminAndCustomer(
      adminEmail,
      adminPhone,
      email,
      phone,
      type,
      {
        restaurantName: restaurant ? restaurant.name : "bulebeti Partner",
        guestName,
        customerName: guestName,
        date,
        time,
        guests,
        specialRequests,
        itemsSummary,
        totalPrice,
        orderType,
        notes: specialRequests,
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
