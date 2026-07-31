const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Feedback = require("../models/Feedback");
const Restaurant = require("../models/Restaurant");

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

// Get feedback for a specific restaurant (Requires Auth & Ownership)
router.get("/restaurant/:restaurantId", auth, async (req, res) => {
  try {
    const authorized = await canManageRestaurant(req.user.id, req.user.role, req.params.restaurantId);
    if (!authorized) {
      return res.status(403).json({ msg: "Forbidden: Access denied" });
    }

    const feedbacks = await Feedback.find({
      restaurantId: req.params.restaurantId,
    }).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    console.error("[GET FEEDBACK ERROR]", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

// Add new feedback (Public)
router.post("/", async (req, res) => {
  try {
    const newFeedback = new Feedback(req.body);
    const feedback = await newFeedback.save();

    // Trigger direct SMS to admin
    try {
      const restaurant = await Restaurant.findById(req.body.restaurantId);

      if (restaurant && restaurant.phone) {
        const twilioSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

        const smsBody = `You have received new feedback from ${feedback.customer || "a customer"}. Rating: ${feedback.rating} stars. Check your bulebeti admin dashboard.`;

        if (twilioSid && twilioToken && twilioPhone) {
          const twilio = require("twilio");
          const client = twilio(twilioSid, twilioToken);

          await client.messages.create({
            body: smsBody,
            from: twilioPhone,
            to: restaurant.phone,
          });
          console.log(
            `[TWILIO] Successfully sent SMS to Admin: ${restaurant.phone}`,
          );
        } else {
          console.log("\n----------------------------------------");
          console.log(
            `[SMS PROVIDER MOCK] Missing Twilio credentials. Skipping real SMS.`,
          );
          console.log(
            `[SMS PROVIDER MOCK] Would have sent SMS to: ${restaurant.phone}`,
          );
          console.log(`[SMS BODY]: ${smsBody}`);
          console.log("----------------------------------------\n");
        }
      }
    } catch (smsErr) {
      console.error("Failed to send admin SMS:", smsErr.message);
    }

    res.json(feedback);
  } catch (err) {
    console.error("[POST FEEDBACK ERROR]", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

// Update feedback status (Requires Auth & Ownership)
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    let feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ msg: "Feedback not found" });

    const authorized = await canManageRestaurant(req.user.id, req.user.role, feedback.restaurantId);
    if (!authorized) {
      return res.status(403).json({ msg: "Forbidden: Access denied" });
    }

    feedback.status = status;
    await feedback.save();

    res.json(feedback);
  } catch (err) {
    console.error("[PUT FEEDBACK ERROR]", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;
