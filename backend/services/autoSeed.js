const bcrypt = require("bcrypt");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");
const Event = require("../models/Event");
const Location = require("../models/Location");

const SUPER_ADMIN_EMAIL = (
  process.env.SUPER_ADMIN_EMAIL || "ethizone1@gmail.com"
).toLowerCase();
const DEMO_ADMIN_EMAIL = "admin@goldentruffle.com";

// Passwords that were committed to the public repository in earlier versions.
// Any seeded account still using one of them has its password cleared so it
// must sign in through Clerk (or set a new password) instead.
const LEAKED_PASSWORDS = ["bulebeti@Ethiopia.2019", "password123"];

async function clearLeakedPassword(user) {
  if (!user || !user.password) return;
  for (const leaked of LEAKED_PASSWORDS) {
    if (await bcrypt.compare(leaked, user.password)) {
      user.password = undefined;
      await user.save();
      console.log(
        `🔒 [AUTO-SEED] Cleared leaked default password for ${user.email}`,
      );
      return;
    }
  }
}

/**
 * Idempotent Auto-Seeder:
 * - Creates the Super Admin only if no super-admin exists yet (never modifies an existing one).
 * - Seeds demo data (sample admin, restaurant, menu) outside production only.
 */
async function autoSeed() {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    // 1. Ensure a Super Admin exists
    let superAdmin = await User.findOne({ role: "super-admin" });

    if (!superAdmin) {
      superAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL });
      if (superAdmin) {
        superAdmin.role = "super-admin";
        await superAdmin.save();
        console.log(`🌱 [AUTO-SEED] Promoted ${SUPER_ADMIN_EMAIL} to Super Admin`);
      } else {
        const initialPassword = process.env.SUPER_ADMIN_PASSWORD;
        superAdmin = new User({
          name: "Super Admin",
          email: SUPER_ADMIN_EMAIL,
          password: initialPassword
            ? await bcrypt.hash(initialPassword, 10)
            : undefined,
          role: "super-admin",
          status: "active",
          isVerified: true,
        });
        await superAdmin.save();
        console.log(`🌱 [AUTO-SEED] Created Super Admin: ${SUPER_ADMIN_EMAIL}`);
      }
    }

    await clearLeakedPassword(superAdmin);

    if (isProduction) {
      await clearLeakedPassword(await User.findOne({ email: DEMO_ADMIN_EMAIL }));
      return;
    }

    // 2. Ensure Default Restaurant Admin User (development only)
    let adminOwner = await User.findOne({ email: DEMO_ADMIN_EMAIL });
    if (!adminOwner) {
      adminOwner = new User({
        name: "Admin User",
        email: DEMO_ADMIN_EMAIL,
        password: await bcrypt.hash("password123", 10),
        role: "admin",
        status: "active",
        isVerified: true,
      });
      await adminOwner.save();
      console.log(
        `🌱 [AUTO-SEED] Created Admin Owner: ${DEMO_ADMIN_EMAIL}`,
      );
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
      console.log(
        "🌱 [AUTO-SEED] Created sample restaurant: The Golden Truffle",
      );

      // Seed initial menu items if none exist
      const menuCount = await MenuItem.countDocuments({
        restaurantId: restaurant._id,
      });
      if (menuCount === 0) {
        await MenuItem.insertMany([
          {
            name: "Truffle Arancini",
            price: 18,
            description:
              "Sicilian rice balls with black truffle.\nIngredients: Arborio rice, Black Truffle, Panko",
            category: "Starters",
            imageUrl:
              "https://images.unsplash.com/photo-1541529086526-db283c563270?w=400&q=80",
            isAvailable: true,
            restaurantId: restaurant._id,
          },
          {
            name: "Pan-Seared Sea Bass",
            price: 42,
            description:
              "With lemon butter sauce.\nIngredients: Sea Bass, Lemon Butter, Asparagus",
            category: "Mains",
            imageUrl:
              "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80",
            isAvailable: true,
            restaurantId: restaurant._id,
          },
        ]);
        console.log("🌱 [AUTO-SEED] Created sample menu items.");
      }

      // Seed initial location if none exist
      const locCount = await Location.countDocuments({
        restaurantId: restaurant._id,
      });
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
