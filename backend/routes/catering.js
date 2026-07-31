const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const CateringRequest = require("../models/CateringRequest");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const {
  notifyAdminAndCustomer,
  notifyStatusUpdate,
} = require("../services/notifications");

// Helper to check restaurant ownership
async function canManageRestaurant(userId, userRole, restaurantId) {
  if (userRole === "super-admin") return true;
  if (!restaurantId) return false;
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return false;
  const isOwner = restaurant.ownerId && restaurant.ownerId.toString() === userId;
  const isAdmin = restaurant.admins && restaurant.admins.some(a => a.user && a.user.toString() === userId);
  return isOwner || isAdmin;
}

// Create a catering request (Public)
router.post("/", async (req, res) => {
  try {
    const {
      eventType,
      guestCount,
      date,
      location,
      name,
      email,
      phone,
      details,
      restaurantSlug,
    } = req.body;

    let restaurantId = null;
    let adminEmail = "admin@bulebeti.com";
    let adminPhone = "N/A";
    let restaurantName = "bulebeti Partners";

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
    notifyAdminAndCustomer(adminEmail, adminPhone, email, phone, "Catering", {
      restaurantName,
      eventType,
      date,
      location,
      guestCount,
      name,
      details,
    });

    res.json(savedRequest);
  } catch (err) {
    console.error("[CATERING POST ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get catering requests for a specific restaurant (Requires auth & management access)
router.get("/restaurant/:restaurantId", auth, async (req, res) => {
  try {
    const authorized = await canManageRestaurant(req.user.id, req.user.role, req.params.restaurantId);
    if (!authorized) {
      return res.status(403).json({ msg: "Forbidden: Access denied to restaurant catering requests" });
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

    const authorized = await canManageRestaurant(req.user.id, req.user.role, cateringRequest.restaurantId);
    if (!authorized) {
      return res.status(403).json({ msg: "Forbidden: Access denied" });
    }

    const previousStatus = cateringRequest.status;
    cateringRequest.status = status;
    await cateringRequest.save();

    // Fire notification only when status actually changed
    if (status !== previousStatus) {
      let restaurantName = "bulebeti Partners";
      if (cateringRequest.restaurantId) {
        const restaurant = await Restaurant.findById(
          cateringRequest.restaurantId,
        );
        if (restaurant) restaurantName = restaurant.name;
      }

      notifyStatusUpdate(
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
