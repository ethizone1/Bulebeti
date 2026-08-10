const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const https = require("https");
const { sendEmail } = require("../services/notifications");

// Validation helper functions
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  if (!phone) return true; // Phone is optional in basic schema, but if provided must be valid
  const phoneRegex = /^\+?[0-9\s\-()]{9,18}$/;
  return phoneRegex.test(phone);
};

// Helper to verify Google ID Token (Zero-Dependency)
function verifyGoogleToken(token) {
  return new Promise((resolve, reject) => {
    // In development mode, check for mock token to allow offline testing
    if (
      process.env.NODE_ENV !== "production" &&
      token.startsWith("mock-google-token-")
    ) {
      const mockEmail = token.replace("mock-google-token-", "");
      const mockName = mockEmail.split("@")[0].replace(/[^a-zA-Z]/g, " ");
      return resolve({
        sub: `mock-google-id-${mockEmail}`,
        email: mockEmail,
        name: mockName || "Mock User",
        picture: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      });
    }

    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`;
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
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
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

// Change Password (pre-auth)
router.post("/change-password-preauth", async (req, res) => {
  try {
    const { email, phone, oldPassword, newPassword } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Account not found with this email" });
    }

    if (!user.password) {
      return res
        .status(400)
        .json({
          msg: "This account uses Google Login. Please sign in with Google.",
        });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid current password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.status = "active";
    user.isVerified = true;
    await user.save();

    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, role, googleToken } = req.body;

    let finalName = name;
    let finalEmail = email ? email.trim().toLowerCase() : "";
    let finalPhone = phone ? phone.trim() : "";
    let googleId = null;
    let picture = null;

    // Strict validation
    if (!finalEmail || !isValidEmail(finalEmail)) {
      return res.status(400).json({ msg: "Please enter a valid, real email address." });
    }

    if (finalPhone && !isValidPhone(finalPhone)) {
      return res.status(400).json({ msg: "Please enter a valid phone number (at least 9 digits)." });
    }

    if (googleToken) {
      try {
        const payload = await verifyGoogleToken(googleToken);
        finalEmail = payload.email.toLowerCase();
        finalName = payload.name || name;
        googleId = payload.sub;
        picture = payload.picture;
      } catch (err) {
        console.error(
          "Google token verification failed during registration:",
          err.message,
        );
        return res.status(400).json({ msg: "Invalid Google token" });
      }
    }

    // Check if user exists
    let user = await User.findOne({ email: finalEmail });
    if (user) {
      // If user exists but is unverified (pending), update password & resend verification code
      if (!user.isVerified && !googleToken) {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
        
        if (password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(password, salt);
        }
        user.name = finalName;
        user.phone = finalPhone;
        user.verificationCode = verificationCode;
        user.verificationCodeExpires = verificationCodeExpires;
        await user.save();

        const subject = "🔐 Complete Your BuleBet Registration - Verification Code";
        const htmlContent = `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
            <h2 style="color: #D4AF37; margin-top: 0;">Confirm Your BuleBet Account</h2>
            <p>Hi <strong>${finalName}</strong>,</p>
            <p>Your registration code is:</p>
            <div style="background: #f3f4f6; font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 16px; border-radius: 8px; margin: 20px 0; color: #111827;">
              ${verificationCode}
            </div>
            <p style="font-size: 13px; color: #6b7280;">This code will expire in 15 minutes.</p>
          </div>
        `;
        await sendEmail(finalEmail, subject, htmlContent, "BuleBet Platform");
        console.log(`[BACKEND] 🔑 Resent verification code to unverified user ${finalEmail}: ${verificationCode}`);

        return res.json({
          requiresVerification: true,
          email: finalEmail,
          msg: "Verification code sent to your email.",
        });
      }

      if (googleToken && !user.googleId) {
        user.googleId = googleId;
        user.isVerified = true;
        user.status = "active";
        if (picture) user.picture = picture;
        await user.save();

        const payload = {
          user: {
            id: user.id,
            role: user.role,
          },
        };

        const Restaurant = require("../models/Restaurant");
        const restaurant = await Restaurant.findOne({ ownerId: user.id });
        const adminOf = await Restaurant.findOne({ "admins.user": user.id });
        let slug = restaurant ? restaurant.slug : adminOf ? adminOf.slug : null;

        return jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: "24h" },
          (err, token) => {
            if (err) throw err;
            return res.json({
              token,
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
              },
              restaurantSlug: slug,
            });
          },
        );
      }

      return res.status(400).json({ msg: "An account with this email address already exists." });
    }

    let hashedPassword = null;
    if (!googleToken) {
      if (!password) {
        return res.status(400).json({ msg: "Password is required" });
      }
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    const isAutoVerified = !!googleToken;

    user = new User({
      name: finalName,
      email: finalEmail,
      phone: finalPhone,
      password: hashedPassword,
      googleId,
      picture,
      role: role || "admin",
      status: isAutoVerified ? "active" : "pending",
      isVerified: isAutoVerified,
      verificationCode: isAutoVerified ? undefined : verificationCode,
      verificationCodeExpires: isAutoVerified ? undefined : verificationCodeExpires,
    });

    await user.save();
    console.log(
      `[BACKEND] ✅ New user registered: ${finalName} (${finalEmail}) - Verified: ${isAutoVerified}`,
    );

    // If registered with Google, issue token immediately
    if (isAutoVerified) {
      const payload = {
        user: {
          id: user.id,
          role: user.role,
        },
      };

      return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
          });
        },
      );
    }

    // Send Verification Email
    const subject = "🔐 Verify Your BuleBet Account Registration";
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
        <h2 style="color: #D4AF37; margin-top: 0;">Welcome to BuleBet!</h2>
        <p>Hi <strong>${finalName}</strong>,</p>
        <p>Please enter the following 6-digit confirmation code in your browser to complete your restaurant registration:</p>
        <div style="background: #f3f4f6; font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 16px; border-radius: 8px; margin: 20px 0; color: #111827;">
          ${verificationCode}
        </div>
        <p style="font-size: 13px; color: #6b7280;">This verification code will expire in 15 minutes.</p>
      </div>
    `;
    await sendEmail(finalEmail, subject, htmlContent, "BuleBet Platform");
    console.log(`[BACKEND] 🔑 Generated verification code for ${finalEmail}: ${verificationCode}`);

    res.json({
      requiresVerification: true,
      email: finalEmail,
      msg: "Verification code sent to your email.",
    });
  } catch (err) {
    console.error("[AUTH REGISTER ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Verify Email OTP
router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ msg: "Email and verification code are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.toString().trim();

    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({ msg: "User account not found." });
    }

    if (user.isVerified && user.status === "active") {
      // User is already verified, generate token and proceed
      const payload = {
        user: {
          id: user.id,
          role: user.role,
        },
      };

      return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
        (err, token) => {
          if (err) throw err;
          return res.json({
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
          });
        }
      );
    }

    if (!user.verificationCode || user.verificationCode !== cleanCode) {
      return res.status(400).json({ msg: "Invalid verification code. Please check your email and try again." });
    }

    if (user.verificationCodeExpires && new Date() > user.verificationCodeExpires) {
      return res.status(400).json({ msg: "Verification code has expired. Please click Resend Code." });
    }

    // Mark as verified & active
    user.isVerified = true;
    user.status = "active";
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    console.log(`[BACKEND] ✅ User verified & activated: ${user.name} (${user.email})`);

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      }
    );
  } catch (err) {
    console.error("[VERIFY EMAIL ERROR]", err.message);
    res.status(500).json({ msg: "Server error during email verification" });
  }
});

// Resend Verification Code
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ msg: "Email address is required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(400).json({ msg: "User account not found." });
    }

    if (user.isVerified && user.status === "active") {
      return res.status(400).json({ msg: "Account is already verified. You can log in directly." });
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = newCode;
    user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const subject = "🔑 New Verification Code - BuleBet Account";
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
        <h2 style="color: #D4AF37; margin-top: 0;">BuleBet Verification Code</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Here is your new 6-digit confirmation code:</p>
        <div style="background: #f3f4f6; font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 16px; border-radius: 8px; margin: 20px 0; color: #111827;">
          ${newCode}
        </div>
        <p style="font-size: 13px; color: #6b7280;">This code will expire in 15 minutes.</p>
      </div>
    `;
    await sendEmail(cleanEmail, subject, htmlContent, "BuleBet Platform");
    console.log(`[BACKEND] 🔑 New verification code generated for ${cleanEmail}: ${newCode}`);

    res.json({ msg: "A new 6-digit verification code has been sent to your email." });
  } catch (err) {
    console.error("[RESEND CODE ERROR]", err.message);
    res.status(500).json({ msg: "Server error while resending verification code." });
  }
});

// Login
router.post("/login", async (req, res) => {
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
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    if (!user.password) {
      return res
        .status(400)
        .json({
          msg: "This account uses Google Login. Please sign in with Google.",
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    const requiresPasswordChange = password === "Admin.123";

    const Restaurant = require("../models/Restaurant");
    const restaurant = await Restaurant.findOne({ ownerId: user.id });

    // Check if they are an admin
    const adminOf = await Restaurant.findOne({ "admins.user": user.id });

    let slug = restaurant ? restaurant.slug : adminOf ? adminOf.slug : null;

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          restaurantSlug: slug,
          requiresPasswordChange,
        });
      },
    );
  } catch (err) {
    console.error("[AUTH LOGIN ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Google Auth Login / Signup (Auto-Signup)
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ msg: "No token provided" });
    }

    let payload;
    try {
      payload = await verifyGoogleToken(token);
    } catch (err) {
      console.error("Google token verification failed:", err.message);
      return res.status(400).json({ msg: "Invalid Google token" });
    }

    const { sub, email, name, picture } = payload;
    if (!email) {
      return res
        .status(400)
        .json({ msg: "Google token payload is missing email" });
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
        role: "customer",
        status: "active",
      });
      await user.save();
      console.log(
        `[BACKEND] ✅ Google auto-registered new user: ${name} (${email}) - Role: customer`,
      );
    }

    // Find restaurant slug if they are an admin or owner
    const Restaurant = require("../models/Restaurant");
    const restaurant = await Restaurant.findOne({ ownerId: user.id });
    const adminOf = await Restaurant.findOne({ "admins.user": user.id });
    let slug = restaurant ? restaurant.slug : adminOf ? adminOf.slug : null;

    const jwtPayload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      jwtPayload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
      (err, jwtToken) => {
        if (err) throw err;
        res.json({
          token: jwtToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            picture: user.picture,
          },
          restaurantSlug: slug,
        });
      },
    );
  } catch (err) {
    console.error("Google auth server error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Change Password
const auth = require("../middleware/auth");
router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect current password" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    console.log(
      `[BACKEND] 🔑 Password updated for user: ${user.name} (${user.email})`,
    );
    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error("[CHANGE PASSWORD ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
