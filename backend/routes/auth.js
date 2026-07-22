const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const https = require('https');

// Helper to verify Google ID Token (Zero-Dependency)
function verifyGoogleToken(token) {
  return new Promise((resolve, reject) => {
    // In development mode, check for mock token to allow offline testing
    if (process.env.NODE_ENV !== 'production' && token.startsWith('mock-google-token-')) {
      const mockEmail = token.replace('mock-google-token-', '');
      const mockName = mockEmail.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
      return resolve({
        sub: `mock-google-id-${mockEmail}`,
        email: mockEmail,
        name: mockName || 'Mock User',
        picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
      });
    }

    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const payload = JSON.parse(data);
          if (payload.error_description || payload.error) {
            reject(new Error(payload.error_description || payload.error));
          } else {
            resolve(payload);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Change Password (pre-auth)
router.post('/change-password-preauth', async (req, res) => {
  try {
    const { email, phone, oldPassword, newPassword } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Account not found with this email' });
    }

    if (!user.password) {
      return res.status(400).json({ msg: 'This account uses Google Login. Please sign in with Google.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.status = 'active';
    await user.save();

    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, googleToken } = req.body;

    let finalName = name;
    let finalEmail = email;
    let googleId = null;
    let picture = null;

    if (googleToken) {
      try {
        const payload = await verifyGoogleToken(googleToken);
        finalEmail = payload.email;
        finalName = payload.name || name;
        googleId = payload.sub;
        picture = payload.picture;
      } catch (err) {
        console.error('Google token verification failed during registration:', err.message);
        return res.status(400).json({ msg: 'Invalid Google token' });
      }
    }

    // Check if user exists
    let user = await User.findOne({ email: finalEmail });
    if (user) {
      // If registering with Google and user already exists but doesn't have googleId, link them and log in
      if (googleToken && !user.googleId) {
        user.googleId = googleId;
        if (picture) user.picture = picture;
        await user.save();
        
        const payload = {
          user: {
            id: user.id,
            role: user.role
          }
        };

        const Restaurant = require('../models/Restaurant');
        const restaurant = await Restaurant.findOne({ ownerId: user.id });
        const adminOf = await Restaurant.findOne({ 'admins.user': user.id });
        let slug = restaurant ? restaurant.slug : (adminOf ? adminOf.slug : null);

        return jwt.sign(payload, process.env.JWT_SECRET || 'bulebet_super_secret_jwt_key_2024', { expiresIn: '24h' }, (err, token) => {
          if (err) throw err;
          return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, restaurantSlug: slug });
        });
      }
      return res.status(400).json({ msg: 'User already exists' });
    }

    let hashedPassword = null;
    if (!googleToken) {
      if (!password) {
        return res.status(400).json({ msg: 'Password is required' });
      }
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    user = new User({
      name: finalName,
      email: finalEmail,
      password: hashedPassword,
      googleId,
      picture,
      role
    });

    await user.save();
    console.log(`[BACKEND] ✅ New user registered: ${finalName} (${finalEmail}) - Role: ${role}`);

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET || 'bulebet_super_secret_jwt_key_2024', { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    let user = null;
    if (email) {
      user = await User.findOne({ email });
    }
    if (!user && phone) {
      user = await User.findOne({ phone });
    }

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    if (!user.password) {
      return res.status(400).json({ msg: 'This account uses Google Login. Please sign in with Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    const requiresPasswordChange = (password === 'Admin.123');

    const Restaurant = require('../models/Restaurant');
    const restaurant = await Restaurant.findOne({ ownerId: user.id });
    
    // Check if they are an admin
    const adminOf = await Restaurant.findOne({ 'admins.user': user.id });

    let slug = restaurant ? restaurant.slug : (adminOf ? adminOf.slug : null);

    jwt.sign(payload, process.env.JWT_SECRET || 'bulebet_super_secret_jwt_key_2024', { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ 
        token, 
        user: { id: user.id, name: user.name, email: user.email, role: user.role }, 
        restaurantSlug: slug,
        requiresPasswordChange
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Google Auth Login / Signup (Auto-Signup)
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ msg: 'No token provided' });
    }

    let payload;
    try {
      payload = await verifyGoogleToken(token);
    } catch (err) {
      console.error('Google token verification failed:', err.message);
      return res.status(400).json({ msg: 'Invalid Google token' });
    }

    const { sub, email, name, picture } = payload;
    if (!email) {
      return res.status(400).json({ msg: 'Google token payload is missing email' });
    }

    // Find user by googleId or email
    let user = await User.findOne({ $or: [{ googleId: sub }, { email }] });

    if (user) {
      // Link googleId if not present
      let updated = false;
      if (!user.googleId) {
        user.googleId = sub;
        updated = true;
      }
      if (!user.picture && picture) {
        user.picture = picture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    } else {
      // Auto-signup: Create user as customer role
      user = new User({
        name,
        email,
        googleId: sub,
        picture,
        role: 'customer',
        status: 'active'
      });
      await user.save();
      console.log(`[BACKEND] ✅ Google auto-registered new user: ${name} (${email}) - Role: customer`);
    }

    // Find restaurant slug if they are an admin or owner
    const Restaurant = require('../models/Restaurant');
    const restaurant = await Restaurant.findOne({ ownerId: user.id });
    const adminOf = await Restaurant.findOne({ 'admins.user': user.id });
    let slug = restaurant ? restaurant.slug : (adminOf ? adminOf.slug : null);

    const jwtPayload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(jwtPayload, process.env.JWT_SECRET || 'bulebet_super_secret_jwt_key_2024', { expiresIn: '24h' }, (err, jwtToken) => {
      if (err) throw err;
      res.json({
        token: jwtToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, picture: user.picture },
        restaurantSlug: slug
      });
    });
  } catch (err) {
    console.error('Google auth server error:', err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Change Password
const auth = require('../middleware/auth');
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    console.log(`[BACKEND] 🔑 Password updated for user: ${user.name} (${user.email})`);
    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

module.exports = router;
