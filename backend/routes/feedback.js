const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  canManageRestaurant,
  restaurantHasTier,
  planRequiredResponse,
} = require("../middleware/ownership");
const Feedback = require("../models/Feedback");
const Restaurant = require("../models/Restaurant");
const { cleanStr, isEmail, isPhone, isObjectId } = require("../utils/validate");

// Get feedback for a specific restaurant (Requires Auth & Ownership)
router.get("/restaurant/:restaurantId", auth, async (req, res) => {
  try {
    const authorized = await canManageRestaurant(
      req.user.id,
      req.user.role,
      req.params.restaurantId,
    );
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
    const restaurantId = cleanStr(req.body.restaurantId, 24);
    const customer = cleanStr(req.body.customer, 100);
    const email = cleanStr(req.body.email, 254).toLowerCase();
    const phone = cleanStr(req.body.phone, 30);
    const rating = Number(req.body.rating);
    const comment = cleanStr(req.body.comment, 2000);
    const date = cleanStr(req.body.date, 40) || new Date().toLocaleDateString();

    if (!isObjectId(restaurantId) || !customer || !comment) {
      return res.status(400).json({ msg: "Name, comment and restaurant are required." });
    }
    if (!isPhone(phone) || (email && !isEmail(email))) {
      return res.status(400).json({ msg: "Please enter valid contact details." });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ msg: "Rating must be between 1 and 5." });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found." });
    }

    // Only customer-facing fields are accepted; status is set by the restaurant
    const newFeedback = new Feedback({
      restaurantId,
      customer,
      email,
      phone,
      rating,
      comment,
      date,
    });
    const feedback = await newFeedback.save();

    // Trigger direct SMS to admin
    try {

      if (restaurant && restaurant.phone) {
        const twilioSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

        const smsBody = `You have received new feedback from ${feedback.customer || "a customer"}. Rating: ${feedback.rating} stars. Check your MaedBet admin dashboard.`;

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

    const authorized = await canManageRestaurant(
      req.user.id,
      req.user.role,
      feedback.restaurantId,
    );
    if (!authorized) {
      return res.status(403).json({ msg: "Forbidden: Access denied" });
    }
    if (!(await restaurantHasTier(feedback.restaurantId, "Premium", req.user.role))) {
      return planRequiredResponse(res, "Premium");
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
