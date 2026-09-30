const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  canManageRestaurant,
  restaurantHasTier,
  planRequiredResponse,
} = require("../middleware/ownership");
const CateringRequest = require("../models/CateringRequest");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const {
  notifyAdminAndCustomer,
  notifyStatusUpdate,
} = require("../services/notifications");
const { cleanStr, isEmail, isPhone } = require("../utils/validate");

// Create a catering request (Public)
router.post("/", async (req, res) => {
  try {
    const eventType = cleanStr(req.body.eventType, 100);
    const guestCount = Number(req.body.guestCount);
    const date = cleanStr(req.body.date, 40);
    const location = cleanStr(req.body.location, 300);
    const name = cleanStr(req.body.name, 100);
    const email = cleanStr(req.body.email, 254).toLowerCase();
    const phone = cleanStr(req.body.phone, 30);
    const details = cleanStr(req.body.details, 4000);
    const restaurantSlug = cleanStr(req.body.restaurantSlug, 200).toLowerCase();

    if (!eventType || !date || !location || !name || !isEmail(email)) {
      return res.status(400).json({ msg: "Please fill in all required fields with a valid email." });
    }
    if (!isPhone(phone)) {
      return res.status(400).json({ msg: "Please enter a valid phone number." });
    }
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 100000) {
      return res.status(400).json({ msg: "Please enter a valid guest count." });
    }
    if (Number.isNaN(new Date(date).getTime())) {
      return res.status(400).json({ msg: "Please enter a valid event date." });
    }

    let restaurantId = null;
    let adminEmail = "admin@maedbet.com";
    let adminPhone = "N/A";
    let restaurantName = "MaedBet Partners";

    if (restaurantSlug) {
      const restaurant = await Restaurant.findOne({ slug: restaurantSlug });
      if (restaurant) {
        restaurantId = restaurant._id;
        restaurantName = restaurant.name;
        const admin = await User.findById(restaurant.ownerId);
        if (admin) {
          adminEmail = admin.email;
          adminPhone = admin.phone || "N/A";
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
      restaurantId,
    });

    const savedRequest = await newRequest.save();
    console.log(
      `[BACKEND] 🍽️ New Catering Request: ${name} (${email}) for ${eventType} on ${date}`,
    );

    // Trigger Notification
    await notifyAdminAndCustomer(
      adminEmail,
      adminPhone,
      email,
      phone,
      "Catering",
      {
        restaurantName,
        eventType,
        date,
        location,
        guestCount,
        name,
        details,
      },
    );

    res.json(savedRequest);
  } catch (err) {
    console.error("[CATERING POST ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get catering requests for a specific restaurant (Requires auth & management access)
router.get("/restaurant/:restaurantId", auth, async (req, res) => {
  try {
    const authorized = await canManageRestaurant(
      req.user.id,
      req.user.role,
      req.params.restaurantId,
    );
    if (!authorized) {
      return res.status(403).json({
        msg: "Forbidden: Access denied to restaurant catering requests",
      });
    }

    const requests = await CateringRequest.find({
      restaurantId: req.params.restaurantId,
    }).sort({ date: 1 });
    res.json(requests);
  } catch (err) {
    console.error("[CATERING GET ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// PUT to update catering request status (Requires auth & management access)
router.put("/:id", auth, async (req, res) => {
  try {
    const { status } = req.body;

    let cateringRequest = await CateringRequest.findById(req.params.id);
    if (!cateringRequest) {
      return res.status(404).json({ msg: "Catering request not found" });
    }

    const authorized = await canManageRestaurant(
      req.user.id,
      req.user.role,
      cateringRequest.restaurantId,
    );
    if (!authorized) {
      return res.status(403).json({ msg: "Forbidden: Access denied" });
    }
    if (!(await restaurantHasTier(cateringRequest.restaurantId, "Platinum", req.user.role))) {
      return planRequiredResponse(res, "Platinum");
    }

    const previousStatus = cateringRequest.status;
    cateringRequest.status = status;
    await cateringRequest.save();

    // Fire notification only when status actually changed
    if (status !== previousStatus) {
      let restaurantName = "MaedBet Partners";
      if (cateringRequest.restaurantId) {
        const restaurant = await Restaurant.findById(
          cateringRequest.restaurantId,
        );
        if (restaurant) restaurantName = restaurant.name;
      }

      await notifyStatusUpdate(
        "Catering",
        status,
        cateringRequest.email,
        cateringRequest.phone,
        {
          restaurantId: cateringRequest.restaurantId,
          restaurantName,
          name: cateringRequest.name,
          eventType: cateringRequest.eventType,
          date: cateringRequest.date
            ? new Date(cateringRequest.date).toLocaleDateString()
            : "TBD",
          location: cateringRequest.location,
          guestCount: cateringRequest.guestCount,
        },
      );
    }

    res.json(cateringRequest);
  } catch (err) {
    console.error("[CATERING PUT ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
