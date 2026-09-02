async function testUpgradeFlow() {
  const email = `test_owner_${Date.now()}@test.com`;
  const name = `Test Owner ${Date.now()}`;
  const restName = `Test Rest ${Date.now()}`;
  const slug = restName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  console.log('--- STARTING UPGRADE FLOW VERIFICATION ---');
  console.log(`Using email: ${email}, restaurant: ${restName}, slug: ${slug}`);

  try {
    // 1. Register User (admin)
    console.log('\n[Step 1] Registering admin user...');
    const registerRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password: 'password123',
        role: 'admin'
      })
    });

    if (!registerRes.ok) {
      throw new Error(`Registration failed: ${await registerRes.text()}`);
    }

    const authData = await registerRes.json();
    let token = authData.token;

    if (authData.requiresVerification || !token) {
      // Login via /api/auth/login or verify user directly
      const mongoose = require("mongoose");
      const User = require("./models/User");
      const jwt = require("jsonwebtoken");
      const dotenv = require("dotenv");
      dotenv.config();
      const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/bulebeti";
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGO_URI);
      }
      const u = await User.findOne({ email });
      if (u) {
        u.isVerified = true;
        u.status = "active";
        await u.save();
        token = jwt.sign({ user: { id: u.id, role: u.role } }, process.env.JWT_SECRET, { expiresIn: "24h" });
      }
    }

    console.log('✅ Admin user registered & verified successfully. Token received.');

    // 2. Create Restaurant (starts on Basic tier for standard registration)
    console.log('\n[Step 2] Creating restaurant...');
    const createRestRes = await fetch('http://localhost:5000/api/restaurants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({
        name: restName,
        slug,
        address: '123 Test St',
        phone: '123-456-7890',
        email: 'restaurant_contact@test.com',
        menuLayout: 'image-left',
        subscriptionTier: 'Gold'
      })
    });

    if (!createRestRes.ok) {
      throw new Error(`Restaurant creation failed: ${await createRestRes.text()}`);
    }

    const restaurant = await createRestRes.json();
    console.log(`✅ Restaurant created. Initial active tier: ${restaurant.subscriptionTier}, Slug: ${restaurant.slug}`);

    // 3. Request Upgrade to Gold
    console.log('\n[Step 3] Submitting upgrade request for Gold tier...');
    const upgradeReqRes = await fetch(`http://localhost:5000/api/restaurants/${slug}/request-upgrade`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ tier: 'Gold' })
    });

    if (!upgradeReqRes.ok) {
      throw new Error(`Upgrade request failed: ${await upgradeReqRes.text()}`);
    }

    const upgradeData = await upgradeReqRes.json();
    console.log(`✅ Upgrade request submitted: ${JSON.stringify(upgradeData)}`);

    if (restaurant.email !== 'restaurant_contact@test.com') {
      throw new Error(`Expected email to be restaurant_contact@test.com, but got: ${restaurant.email}`);
    }

    // 3. Request Upgrade to Premium
    console.log('\n[Step 3] Requesting upgrade to Premium...');
    const requestRes = await fetch(`http://localhost:5000/api/restaurants/${slug}/request-upgrade`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ tier: 'Premium' })
    });

    if (!requestRes.ok) {
      throw new Error(`Request upgrade failed: ${await requestRes.text()}`);
    }

    const afterRequestData = await requestRes.json();
    const afterRequest = afterRequestData.restaurant || afterRequestData;
    console.log(`✅ Upgrade requested. pendingTierRequest: ${afterRequest.pendingTierRequest}`);

    if (afterRequest.pendingTierRequest !== 'Premium') {
      throw new Error(`Expected pendingTierRequest to be Premium, but got: ${afterRequest.pendingTierRequest}`);
    }

    // 4. Admin Approve Upgrade
    console.log('\n[Step 4] Approving upgrade as Super Admin...');
    const jwt = require("jsonwebtoken");
    const superAdminToken = jwt.sign({ user: { id: "superadmin_test_id", role: "super-admin" } }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const approveRes = await fetch(`http://localhost:5000/api/restaurants/admin/upgrade/${restaurant._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': superAdminToken
      },
      body: JSON.stringify({
        subscriptionTier: 'Premium',
        clearPending: true
      })
    });

    if (!approveRes.ok) {
      throw new Error(`Approve upgrade failed: ${await approveRes.text()}`);
    }

    const afterApproveData = await approveRes.json();
    const afterApprove = afterApproveData.restaurant || afterApproveData;
    console.log(`✅ Upgrade approved. subscriptionTier: ${afterApprove.subscriptionTier}, pendingTierRequest: '${afterApprove.pendingTierRequest}'`);

    if (afterApprove.subscriptionTier !== 'Premium' || afterApprove.pendingTierRequest !== '') {
      throw new Error(`Unexpected tier state after approval: tier=${afterApprove.subscriptionTier}, pending=${afterApprove.pendingTierRequest}`);
    }

    console.log('\n🎉 ALL UPGRADE FLOW VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err.message);
  }
}

testUpgradeFlow();
