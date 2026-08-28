const bcrypt = require("bcrypt");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");
const Event = require("../models/Event");
const Location = require("../models/Location");

/**
 * Idempotent Auto-Seeder:
 * Ensures Super Admin and default admin credentials exist on server startup.
 * Safe for both development and live production environments.
 */
async function autoSeed() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    // 1. Ensure Super Admin User
    let superAdmin = await User.findOne({
      $or: [{ email: "superadmin@bulebeti.com" }, { role: "super-admin" }],
    });

    if (!superAdmin) {
      superAdmin = new User({
        name: "Super Admin",
        email: "superadmin@bulebeti.com",
        password: hashedPassword,
        role: "super-admin",
        status: "active",
        isVerified: true,
      });
      await superAdmin.save();
      console.log("🌱 [AUTO-SEED] Created Super Admin: superadmin@bulebeti.com");
    } else {
      console.log("🌱 [AUTO-SEED] Super Admin account verified.");
    }

    // 2. Ensure Default Restaurant Admin User
    let adminOwner = await User.findOne({ email: "admin@goldentruffle.com" });
    if (!adminOwner) {
      adminOwner = new User({
        name: "Admin User",
        email: "admin@goldentruffle.com",
        password: hashedPassword,
        role: "admin",
        status: "active",
        isVerified: true,
      });
      await adminOwner.save();
      console.log("🌱 [AUTO-SEED] Created Admin Owner: admin@goldentruffle.com");
    }

    // 3. Ensure Default Restaurant
    let restaurant = await Restaurant.findOne({ slug: "the-golden-truffle" });
    if (!restaurant && adminOwner) {
      restaurant = new Restaurant({
        name: "The Golden Truffle",
        slug: "the-golden-truffle",
        description: "An exquisite dining experience.",
        address: "123 Truffle Way, Culinary District",
        phone: "555-0199",
        ownerId: adminOwner._id,
      });
      await restaurant.save();
      console.log("🌱 [AUTO-SEED] Created sample restaurant: The Golden Truffle");

      // Seed initial menu items if none exist
      const menuCount = await MenuItem.countDocuments({ restaurantId: restaurant._id });
      if (menuCount === 0) {
        await MenuItem.insertMany([
          {
            name: "Truffle Arancini",
            price: 18,
            description: "Sicilian rice balls with black truffle.\nIngredients: Arborio rice, Black Truffle, Panko",
            category: "Starters",
            imageUrl: "https://images.unsplash.com/photo-1541529086526-db283c563270?w=400&q=80",
            isAvailable: true,
            restaurantId: restaurant._id,
          },
          {
            name: "Pan-Seared Sea Bass",
            price: 42,
            description: "With lemon butter sauce.\nIngredients: Sea Bass, Lemon Butter, Asparagus",
            category: "Mains",
            imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80",
            isAvailable: true,
            restaurantId: restaurant._id,
          },
        ]);
        console.log("🌱 [AUTO-SEED] Created sample menu items.");
      }

      // Seed initial location if none exist
      const locCount = await Location.countDocuments({ restaurantId: restaurant._id });
      if (locCount === 0) {
        await Location.insertMany([
          {
            restaurantId: restaurant._id,
            name: "Bulebet Downtown",
            address: "123 Main St, New York, NY",
            capacity: 80,
            status: "Open",
          },
        ]);
        console.log("🌱 [AUTO-SEED] Created sample location.");
      }
    }
  } catch (err) {
    console.error("❌ [AUTO-SEED ERROR]", err.message);
  }
}

module.exports = autoSeed;
