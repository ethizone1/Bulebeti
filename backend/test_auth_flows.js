const mongoose = require('mongoose');
const dotenv = require('dotenv');
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./models/User');

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bulebet';
const PORT = 5001;

async function runTests() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  // Clean up old test accounts
  await User.deleteMany({
    email: { $in: ['test-dual-login@example.com', 'test-google-login@example.com'] }
  });
  console.log('🧹 Cleaned up old test users.');

  // Setup mock Express server
  const app = express();
  app.use(express.json());
  app.use('/api/auth', require('./routes/auth'));

  const server = app.listen(PORT, async () => {
    console.log(`🚀 Temporary test server running on port ${PORT}`);
    
    try {
      // 1. Create standard test user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Password.123', salt);
      const testUser = new User({
        name: 'Dual Login User',
        email: 'test-dual-login@example.com',
        phone: '1234567890',
        password: hashedPassword,
        role: 'customer',
        status: 'active'
      });
      await testUser.save();
      console.log('💾 Created test user with email: test-dual-login@example.com, phone: 1234567890');

      // 2. Test Login with Email
      console.log('\n👉 Test Case 2: Standard Login with Email');
      const emailLoginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test-dual-login@example.com', password: 'Password.123' })
      });
      const emailLoginData = await emailLoginRes.json();
      if (emailLoginRes.ok && emailLoginData.token) {
        console.log('✅ PASS: Login via Email successful.');
      } else {
        console.error('❌ FAIL: Login via Email failed:', emailLoginData);
      }

      // 3. Test Login with Phone
      console.log('\n👉 Test Case 3: Standard Login with Phone');
      const phoneLoginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '1234567890', password: 'Password.123' })
      });
      const phoneLoginData = await phoneLoginRes.json();
      if (phoneLoginRes.ok && phoneLoginData.token) {
        console.log('✅ PASS: Login via Phone successful.');
      } else {
        console.error('❌ FAIL: Login via Phone failed:', phoneLoginData);
      }

      // 4. Test Google login (auto-signup)
      console.log('\n👉 Test Case 4: Google OAuth Auto-Signup');
      const googleSignupRes = await fetch(`http://localhost:${PORT}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'mock-google-token-test-google-login@example.com' })
      });
      const googleSignupData = await googleSignupRes.json();
      if (googleSignupRes.ok && googleSignupData.token && googleSignupData.user.email === 'test-google-login@example.com') {
        console.log('✅ PASS: Google Auto-Signup successful. User created & logged in.');
      } else {
        console.error('❌ FAIL: Google Auto-Signup failed:', googleSignupData);
      }

      // 5. Verify user actually exists in database
      const createdGoogleUser = await User.findOne({ email: 'test-google-login@example.com' });
      if (createdGoogleUser && createdGoogleUser.googleId.startsWith('mock-google-id-')) {
        console.log('✅ PASS: Google user verified in MongoDB.');
      } else {
        console.error('❌ FAIL: Google user not found in MongoDB or incorrect googleId.');
      }

      // 6. Test Google login (existing user)
      console.log('\n👉 Test Case 6: Google OAuth Login for Existing User');
      const googleLoginRes = await fetch(`http://localhost:${PORT}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'mock-google-token-test-google-login@example.com' })
      });
      const googleLoginData = await googleLoginRes.json();
      if (googleLoginRes.ok && googleLoginData.token) {
        console.log('✅ PASS: Google Login for existing user successful.');
      } else {
        console.error('❌ FAIL: Google Login for existing user failed:', googleLoginData);
      }

      // 7. Test guard against logging in via standard credentials for Google-only users
      console.log('\n👉 Test Case 7: Prevent standard password login for Google-only users');
      const badPasswordRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test-google-login@example.com', password: 'SomePassword' })
      });
      const badPasswordData = await badPasswordRes.json();
      if (!badPasswordRes.ok && badPasswordData.msg && badPasswordData.msg.includes('Google Login')) {
        console.log('✅ PASS: Blocked standard login for Google-only user. Msg:', badPasswordData.msg);
      } else {
        console.error('❌ FAIL: Standard login was not blocked or returned incorrect msg:', badPasswordData);
      }

    } catch (err) {
      console.error('💥 Test execution error:', err);
    } finally {
      // Cleanup
      await User.deleteMany({
        email: { $in: ['test-dual-login@example.com', 'test-google-login@example.com'] }
      });
      console.log('\n🧹 Cleaned up test database records.');
      server.close(() => {
        console.log('🛑 Test server stopped.');
        mongoose.disconnect().then(() => {
          console.log('👋 MongoDB disconnected. Tests complete.');
        });
      });
    }
  });
}

runTests();
