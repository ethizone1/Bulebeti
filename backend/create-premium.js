const mongoose = require("mongoose");
const Restaurant = require("./models/Restaurant");
const User = require("./models/User");

mongoose.connect("mongodb://localhost:27017/bulebeti").then(async () => {
  try {
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      console.log("No admin found, aborting.");
      process.exit(1);
    }

    const premium = new Restaurant({
      name: "Premium Restaurant",
      slug: "premium",
      description: "A premium testing restaurant.",
      address: "123 Premium Way",
      phone: "555-PREMIUM",
      ownerId: admin._id,
    });

    await premium.save();
    console.log("Created premium restaurant successfully.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});
