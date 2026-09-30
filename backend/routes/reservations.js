const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  canManageRestaurant,
  restaurantHasTier,
  planRequiredResponse,
} = require("../middleware/ownership");
const Reservation = require("../models/Reservation");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const {
  notifyAdminAndCustomer,
  notifyStatusUpdate,
} = require("../services/notifications");
const { cleanStr, isEmail, isPhone, isObjectId } = require("../utils/validate");

// POST a new reservation (Public)
router.post("/", async (req, res) => {
  try {
    const { restaurantId } = req.body;
    const guestName = cleanStr(req.body.guestName, 100);
    const email = cleanStr(req.body.email, 254).toLowerCase();
    const rawPhone = cleanStr(req.body.phone, 30);
    const phone = rawPhone && rawPhone !== "N/A" ? rawPhone : "N/A";
    const date = cleanStr(req.body.date, 40);
    const time = cleanStr(req.body.time, 40);
    const guests = Number(req.body.guests);
    const specialRequests = cleanStr(req.body.specialRequests, 2000);

    if (!guestName || !isEmail(email) || !date || !time) {
      return res.status(400).json({ msg: "Name, a valid email, date and time are required." });
    }
    if (phone !== "N/A" && !isPhone(phone)) {
      return res.status(400).json({ msg: "Please enter a valid phone number." });
    }
    if (!Number.isInteger(guests) || guests < 1 || guests > 1000) {
      return res.status(400).json({ msg: "Please enter a valid number of guests." });
    }

    // Accept a restaurant ID or slug; the restaurant must exist
    const idOrSlug = cleanStr(restaurantId, 200);
    const restaurant = !idOrSlug
      ? null
      : isObjectId(idOrSlug)
        ? await Restaurant.findById(idOrSlug)
        : await Restaurant.findOne({ slug: idOrSlug.toLowerCase() });
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found." });
    }

    const newReservation = new Reservation({
      restaurantId: restaurant._id,
      guestName,
      email,
      phone,
      date,
      time,
      guests,
      specialRequests,
    });

    const reservation = await newReservation.save();

    let adminEmail = restaurant.email || "";
    let adminPhone = restaurant.phone || "N/A";
    const admin = await User.findById(restaurant.ownerId);
    if (admin) {
      adminEmail = admin.email || adminEmail;
      adminPhone = admin.phone || adminPhone;
    }

    const isOrder =
      specialRequests && specialRequests.toUpperCase().includes("ONLINE ORDER");
    const type = isOrder ? "Order" : "Reservation";

    const itemsSummary = specialRequests ? specialRequests : "Menu Items";
    const totalPrice =
      specialRequests && specialRequests.includes("Total: $")
        ? specialRequests.split("Total: $")[1].split(". ")[0]
        : "0.00";
    const orderType =
      specialRequests && specialRequests.includes("ONLINE ORDER (")
        ? specialRequests.split("ONLINE ORDER (")[1].split(")")[0]
        : "Online Order";

    // Trigger Notification
    await notifyAdminAndCustomer(adminEmail, adminPhone, email, phone, type, {
      restaurantName: restaurant.name,
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
    });

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

    const authorized = await canManageRestaurant(
      req.user.id,
      req.user.role,
      restaurant._id,
    );
    if (!authorized) {
      return res.status(403).json({
        msg: "Forbidden: You are not authorized for this restaurant's reservations",
      });
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

// PUT to update reservation or order status (Requires Auth & Ownership)
const updateReservationStatusHandler = async (req, res) => {
  try {
    const { status } = req.body;

    let reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ msg: "Reservation / Order not found" });
    }

    const authorized = await canManageRestaurant(
      req.user.id,
      req.user.role,
      reservation.restaurantId,
    );
    if (!authorized) {
      return res.status(403).json({ msg: "Forbidden: Access denied" });
    }
    if (!(await restaurantHasTier(reservation.restaurantId, "Gold", req.user.role))) {
      return planRequiredResponse(res, "Gold");
    }

    const previousStatus = reservation.status;
    reservation.status = status;
    await reservation.save();

    // Fire notification only when status actually changed
    if (status !== previousStatus) {
      const restaurant = await Restaurant.findById(reservation.restaurantId);
      const isOrder = (reservation.specialRequests || "")
        .toUpperCase()
        .includes("ONLINE ORDER");
      const type = isOrder ? "Order" : "Reservation";

      await notifyStatusUpdate(
        type,
        status,
        reservation.email,
        reservation.phone,
        {
          restaurantId: reservation.restaurantId,
          restaurantName: restaurant ? restaurant.name : "MaedBet Partner",
          guestName: reservation.guestName,
          customerName: reservation.guestName,
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
    res.status(500).json({ msg: err.message || "Server error" });
  }
};

router.put("/:id", auth, updateReservationStatusHandler);
router.put("/:id/status", auth, updateReservationStatusHandler);

module.exports = router;
