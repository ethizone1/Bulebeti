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
    const token = authData.token;
    console.log('✅ Admin user registered successfully. Token received.');

    // 2. Create Restaurant with 'Gold' plan selected
    console.log('\n[Step 2] Creating restaurant with Gold plan...');
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
    console.log(`✅ Restaurant created. Active tier: ${restaurant.subscriptionTier}, Email: ${restaurant.email}, ID: ${restaurant._id}`);

    if (restaurant.subscriptionTier !== 'Gold') {
      throw new Error(`Expected tier to be Gold, but got: ${restaurant.subscriptionTier}`);
    }

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

    const afterRequest = await requestRes.json();
    console.log(`✅ Upgrade requested. pendingTierRequest: ${afterRequest.pendingTierRequest}`);

    if (afterRequest.pendingTierRequest !== 'Premium') {
      throw new Error(`Expected pendingTierRequest to be Premium, but got: ${afterRequest.pendingTierRequest}`);
    }

    // 4. Admin Approve Upgrade
    console.log('\n[Step 4] Approving upgrade as Super Admin...');
    const approveRes = await fetch(`http://localhost:5000/api/restaurants/admin/upgrade/${restaurant._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionTier: 'Premium',
        clearPending: true
      })
    });

    if (!approveRes.ok) {
      throw new Error(`Approve upgrade failed: ${await approveRes.text()}`);
    }

    const afterApprove = await approveRes.json();
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
