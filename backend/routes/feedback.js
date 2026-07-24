const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");

// Get feedback for a specific restaurant
router.get("/restaurant/:restaurantId", async (req, res) => {
  try {
    const feedbacks = await Feedback.find({
      restaurantId: req.params.restaurantId,
    }).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});
// Add new feedback
router.post("/", async (req, res) => {
  try {
    const newFeedback = new Feedback(req.body);
    const feedback = await newFeedback.save();

    // Trigger direct SMS to admin
    try {
      const Restaurant = require("../models/Restaurant");
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
          // Fallback if credentials aren't configured yet
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
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Update feedback status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    let feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ msg: "Feedback not found" });

    feedback.status = status;
    await feedback.save();

    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
