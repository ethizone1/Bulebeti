const mongoose = require("mongoose");
const Restaurant = require("./models/Restaurant");
const Event = require("./models/Event");

mongoose.connect("mongodb://localhost:27017/bulebeti").then(async () => {
  try {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      console.log("No restaurants found. Please run seed.js first.");
      process.exit(1);
    }

    // Check if event collection has data
    const existingEvents = await Event.countDocuments();
    if (existingEvents > 0) {
      console.log("Event collection already exists and has data!");
    } else {
      // Create a dummy event to ensure the collection is created
      const dummyEvent = new Event({
        title: "Grand Opening Night",
        category: "Live Music",
        description:
          "Join us for our grand opening featuring live music, free drinks, and amazing food!",
        restaurantId: restaurant._id,
        restaurantNameField: restaurant.name,
        startDate: new Date().toISOString().split("T")[0],
        startTime: "19:00",
        eventImage:
          "https://images.unsplash.com/photo-1540039155733-d7696f8b9148?w=800&q=80",
        isFree: true,
        status: "Active",
      });
      await dummyEvent.save();
      console.log(
        "Event collection created and dummy event inserted successfully!",
      );
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});
