const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

async function runPreflightCheck() {
  console.log("--------------------------------------------------");
  console.log("🚀 Running Bulebet 10/10 Production Pre-flight Check...");
  console.log("--------------------------------------------------");

  let errors = 0;

  // 1. Verify critical env variables
  if (!process.env.JWT_SECRET) {
    console.error(`❌ [ENV ERROR] Missing required env var: JWT_SECRET`);
    errors++;
  } else {
    console.log(`✅ [ENV CHECK] JWT_SECRET is configured.`);
  }

  // 2. Test MongoDB Atlas Connection
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/bulebet";
  try {
    console.log(`🔄 Connecting to MongoDB: ${uri.replace(/\/\/.*@/, "//***:***@")}...`);
    await mongoose.connect(uri);
    console.log("✅ [DB CHECK] MongoDB connection successful.");
  } catch (err) {
    console.error(`❌ [DB ERROR] MongoDB connection failed: ${err.message}`);
    errors++;
  }

  // 3. Verify Models & Indexes
  try {
    const User = require("../models/User");
    const Restaurant = require("../models/Restaurant");
    await User.init();
    await Restaurant.init();
    console.log("✅ [SCHEMA CHECK] Mongoose schema & index initializations clean.");
  } catch (err) {
    console.error(`❌ [SCHEMA ERROR] Index initialization error: ${err.message}`);
    errors++;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }

  console.log("--------------------------------------------------");
  if (errors === 0) {
    console.log("🎉 PRE-FLIGHT CHECK PASSED: 10/10 PRODUCTION READY!");
    process.exit(0);
  } else {
    console.error(`💥 PRE-FLIGHT CHECK FAILED with ${errors} error(s).`);
    process.exit(1);
  }
}

runPreflightCheck();
