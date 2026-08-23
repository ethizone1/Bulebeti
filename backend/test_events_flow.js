const mongoose = require("mongoose");
const dotenv = require("dotenv");
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Restaurant = require("./models/Restaurant");
const Event = require("./models/Event");

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/bulebeti";
const PORT = 5002;
const JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-12345";

async function runEventsTest() {
  console.log("🔄 Connecting to MongoDB for Events API Verification...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB.");

  // Setup Express App
  const app = express();
  app.use(express.json());
  app.use("/api/events", require("./routes/events"));

  const server = app.listen(PORT, async () => {
    console.log(`🚀 Events test server running on port ${PORT}`);

    try {
      // Find or create test admin & restaurant
      let admin = await User.findOne({ role: "admin" });
      if (!admin) {
        admin = new User({ name: "Event Admin", email: "eventadmin@test.com", password: "hash", role: "admin", status: "active" });
        await admin.save();
      }

      let restaurant = await Restaurant.findOne({ ownerId: admin._id });
      if (!restaurant) {
        restaurant = new Restaurant({ name: "Event Test Rest", slug: "event-test-rest", ownerId: admin._id });
        await restaurant.save();
      }

      const token = jwt.sign({ user: { id: admin.id, role: admin.role } }, process.env.JWT_SECRET || JWT_SECRET, { expiresIn: "1h" });

      // 1. Test GET /api/events
      console.log("\n👉 Step 1: GET /api/events (Public)");
      const getRes = await fetch(`http://localhost:${PORT}/api/events`);
      const getEvents = await getRes.json();
      console.log(`✅ GET /api/events returned HTTP ${getRes.status}. Events count: ${getEvents.length}`);

      // 2. Test POST /api/events (Create Event)
      console.log("\n👉 Step 2: POST /api/events (Create Event)");
      const createRes = await fetch(`http://localhost:${PORT}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-auth-token": token },
        body: JSON.stringify({
          title: "QA Test Live Concert",
          category: "Live Music",
          description: "A music concert test event.",
          startDate: "2026-12-01",
          restaurantId: restaurant._id,
          status: "Active"
        })
      });

      const newEvent = await createRes.json();
      if (createRes.ok && newEvent._id) {
        console.log(`✅ Event created successfully! ID: ${newEvent._id}, Title: ${newEvent.title}`);
      } else {
        throw new Error(`Failed to create event: ${JSON.stringify(newEvent)}`);
      }

      // 3. Test PUT /api/events/:id (Update Event)
      console.log("\n👉 Step 3: PUT /api/events/:id (Update Event)");
      const updateRes = await fetch(`http://localhost:${PORT}/api/events/${newEvent._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-auth-token": token },
        body: JSON.stringify({ title: "QA Test Live Concert (Updated)" })
      });
      const updatedEvent = await updateRes.json();
      if (updateRes.ok && updatedEvent.title.includes("Updated")) {
        console.log(`✅ Event updated successfully! New Title: ${updatedEvent.title}`);
      } else {
        throw new Error(`Failed to update event: ${JSON.stringify(updatedEvent)}`);
      }

      // 4. Test DELETE /api/events/:id (Delete Event)
      console.log("\n👉 Step 4: DELETE /api/events/:id (Delete Event)");
      const deleteRes = await fetch(`http://localhost:${PORT}/api/events/${newEvent._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-auth-token": token }
      });
      const deleteData = await deleteRes.json();
      if (deleteRes.ok && deleteData.msg === "Event removed") {
        console.log("✅ Event deleted successfully!");
      } else {
        throw new Error(`Failed to delete event: ${JSON.stringify(deleteData)}`);
      }

      console.log("\n🎉 ALL EVENTS API VERIFICATION TESTS PASSED SUCCESSFULLY!");
    } catch (err) {
      console.error("\n❌ EVENTS VERIFICATION FAILED:", err.message);
    } finally {
      server.close(() => {
        mongoose.disconnect().then(() => {
          console.log("👋 DB disconnected. Tests finished.");
        });
      });
    }
  });
}

runEventsTest();
