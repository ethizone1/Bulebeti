/**
 * Test Suite: Clerk Managed Authentication & MongoDB Synchronization
 * Verifies User creation, Account-Linking by verified email, Tenant Isolation, and Role Authorization.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");
const Restaurant = require("./models/Restaurant");
const authMiddleware = require("./middleware/auth");
const { canManageRestaurant, requireRestaurantOwnership } = require("./middleware/ownership");

async function runAuthMigrationTests() {
  console.log("🧪 [TEST SUITE] Starting Clerk Auth & Tenant Isolation Verification...");

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/bulebet_test";
  
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected successfully.");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }

  let testUserA = null;
  let testUserB = null;
  let testRestaurantA = null;
  let testRestaurantB = null;

  try {
    // 1. Clean up old test data if present
    await User.deleteMany({ email: { $in: ["test_owner_a@maedbet.com", "test_owner_b@maedbet.com"] } });
    await Restaurant.deleteMany({ name: { $in: ["Test Restaurant Alpha", "Test Restaurant Beta"] } });

    // 2. Create Test Users & Restaurants in MongoDB
    testUserA = new User({
      name: "Owner Alpha",
      email: "test_owner_a@maedbet.com",
      role: "admin",
      status: "active",
      isVerified: true,
    });
    await testUserA.save();

    testUserB = new User({
      name: "Owner Beta",
      email: "test_owner_b@maedbet.com",
      role: "admin",
      status: "active",
      isVerified: true,
    });
    await testUserB.save();

    testRestaurantA = new Restaurant({
      name: "Test Restaurant Alpha",
      slug: "test-restaurant-alpha",
      ownerId: testUserA._id,
      cuisineType: "Ethiopian",
    });
    await testRestaurantA.save();

    testRestaurantB = new Restaurant({
      name: "Test Restaurant Beta",
      slug: "test-restaurant-beta",
      ownerId: testUserB._id,
      cuisineType: "Italian",
    });
    await testRestaurantB.save();

    console.log("✅ Created Test Users & Restaurants in MongoDB.");

    // TEST 1: Account-Linking by Verified Email
    console.log("\n--- TEST 1: Existing User Account-Linking by Verified Email ---");
    const mockClerkUserId = "user_clerk_test_12345";
    const req = {
      header: (name) => {
        if (name === "Authorization") return `Bearer test_token`;
        return null;
      },
      auth: { userId: mockClerkUserId },
    };
    
    // Simulate JWT payload with verified email
    const secret = process.env.JWT_SECRET || "bulebet_super_secret_jwt_key_2024";
    const mockToken = jwt.sign(
      { sub: mockClerkUserId, email: "test_owner_a@maedbet.com", email_verified: true },
      secret
    );
    req.header = (name) => (name === "Authorization" ? `Bearer ${mockToken}` : null);

    const res = {
      status: (code) => ({
        json: (data) => console.log(`[HTTP ${code}]`, data),
      }),
    };

    let nextCalled = false;
    await authMiddleware(req, res, () => {
      nextCalled = true;
    });

    if (nextCalled && req.user && req.user.email === "test_owner_a@maedbet.com") {
      console.log("PASS: Existing MongoDB user linked to Clerk ID successfully!");
      console.log("      User ID:", req.user.id, "| clerkUserId:", req.user.clerkUserId);
    } else {
      console.error("FAIL: Account-linking did not execute correctly.");
    }

    // TEST 2: Tenant Isolation Verification (Phase 24)
    console.log("\n--- TEST 2: Multi-Tenant Ownership Authorization Isolation ---");

    const ownerACanAccessA = await canManageRestaurant(
      testUserA._id.toString(),
      testUserA.role,
      testRestaurantA._id.toString()
    );
    console.log(`Owner A accessing Restaurant A: ${ownerACanAccessA ? "PASS (Allowed)" : "FAIL (Denied)"}`);

    const ownerACanAccessB = await canManageRestaurant(
      testUserA._id.toString(),
      testUserA.role,
      testRestaurantB._id.toString()
    );
    console.log(`Owner A accessing Restaurant B: ${!ownerACanAccessB ? "PASS (Denied as expected)" : "FAIL (Cross-Tenant Breach Allowed!)"}`);

    const superAdminCanAccessB = await canManageRestaurant(
      testUserA._id.toString(),
      "super-admin",
      testRestaurantB._id.toString()
    );
    console.log(`Super Admin accessing Restaurant B: ${superAdminCanAccessB ? "PASS (Allowed)" : "FAIL (Denied)"}`);

    if (ownerACanAccessA && !ownerACanAccessB && superAdminCanAccessB) {
      console.log("\n🎉 TENANT ISOLATION PASSED ALL SECURITY CHECKS!");
    } else {
      console.error("\n❌ TENANT ISOLATION SECURITY BREACH DETECTED!");
    }

  } catch (err) {
    console.error("❌ Test execution error:", err);
  } finally {
    // Cleanup test records
    if (testUserA) await User.findByIdAndDelete(testUserA._id);
    if (testUserB) await User.findByIdAndDelete(testUserB._id);
    if (testRestaurantA) await Restaurant.findByIdAndDelete(testRestaurantA._id);
    if (testRestaurantB) await Restaurant.findByIdAndDelete(testRestaurantB._id);
    await mongoose.disconnect();
    console.log("\n🏁 Test execution completed & disconnected from MongoDB.");
  }
}

runAuthMigrationTests();
