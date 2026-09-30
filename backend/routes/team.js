const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const { sendEmail, sendSMS } = require("../services/notifications");
const { escapeHtml, isEmail } = require("../utils/validate");

const normalizeTier = (t) => {
  const str = String(t || "").trim().toLowerCase();
  if (str.includes("premium")) return "Premium";
  if (str.includes("platinum")) return "Platinum";
  if (str.includes("gold")) return "Gold";
  return "Basic";
};

// Middleware to check if user is Owner or Manager
const verifyOwnerOrManager = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug });
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    const isOwner = restaurant.ownerId.toString() === req.user.id;
    const adminRecord = restaurant.admins.find(
      (a) => a.user.toString() === req.user.id,
    );
    const canManageTeam =
      adminRecord &&
      adminRecord.permissions &&
      adminRecord.permissions.includes("manage_team");
    const isSuperAdmin =
      req.user.role === "super-admin" || req.user.role === "hub owner";

    if (!isOwner && !canManageTeam && !isSuperAdmin) {
      return res.status(403).json({
        msg: "Only the restaurant owner, an authorized admin, or a super-admin can perform this action",
      });
    }

    req.restaurant = restaurant; // pass down
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// GET all admins for a restaurant
router.get("/:slug/team", auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug })
      .populate("ownerId", "name email")
      .populate("admins.user", "name email");

    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    // Check basic access (Owner or any Admin)
    const isOwner = restaurant.ownerId._id.toString() === req.user.id;
    const isAdmin = restaurant.admins.some(
      (a) => a.user._id.toString() === req.user.id,
    );

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ msg: "Access denied" });
    }

    res.json({
      owner: restaurant.ownerId,
      admins: restaurant.admins,
      subscriptionTier: restaurant.subscriptionTier,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// POST add a new admin
router.post("/:slug/team", auth, verifyOwnerOrManager, async (req, res) => {
  const { permissions } = req.body;
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";
  const restaurant = req.restaurant;

  if (!isEmail(email)) {
    return res.status(400).json({ msg: "Please enter a valid email address." });
  }

  try {
    let targetUser = await User.findOne({ email });

    // Validate everything before creating accounts or sending notifications
    if (targetUser && restaurant.ownerId.toString() === targetUser._id.toString()) {
      return res.status(400).json({ msg: "Cannot add the owner as an admin." });
    }

    if (
      targetUser &&
      restaurant.admins.some((a) => a.user.toString() === targetUser._id.toString())
    ) {
      return res.status(400).json({ msg: "User is already an admin." });
    }

    const currentTier = normalizeTier(restaurant.subscriptionTier);
    let maxTeam = 1; // Basic: 1 admin
    if (currentTier === "Gold") maxTeam = 3;
    if (currentTier === "Platinum") maxTeam = 10;
    if (currentTier === "Premium") maxTeam = 999;

    if (restaurant.admins.length >= maxTeam) {
      return res.status(403).json({
        msg: `You have reached the maximum number of team members (${maxTeam}) for the ${currentTier} plan. Please upgrade to add more.`,
      });
    }

    // New members get a password-less account; they sign in with an email code
    // and the auth middleware links that sign-in to this record by email.
    if (!targetUser) {
      targetUser = new User({
        name: "Pending Admin",
        email,
        phone,
        role: "sub-admin",
        status: "active",
      });
      await targetUser.save();
    }

    restaurant.admins.push({
      user: targetUser._id,
      permissions: permissions || [],
    });
    await restaurant.save();

    const frontendHost = process.env.FRONTEND_URL || "http://localhost:5173";
    const inviteUrl = `${frontendHost}/activate?email=${encodeURIComponent(email)}&restaurant=${encodeURIComponent(restaurant.slug)}`;

    const emailSubject = `🔑 You're invited to manage ${restaurant.name}`;
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; background: #ffffff;">
        <h2 style="color: #D4AF37; margin-top: 0;">You've Been Invited!</h2>
        <p>Hi,</p>
        <p>You have been added to the team for <strong>${escapeHtml(restaurant.name)}</strong> on MaedBet.</p>
        <p>Sign in with <strong>${escapeHtml(email)}</strong>. We'll email you a 6-digit code; no password is needed.</p>
        <a href="${escapeHtml(inviteUrl)}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin: 12px 0;">Sign in to MaedBet</a>
        <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">Or open this link directly:<br/><a href="${escapeHtml(inviteUrl)}">${escapeHtml(inviteUrl)}</a></p>
      </div>
    `;

    try {
      await sendEmail(email, emailSubject, emailHtml, `${restaurant.name} Admin`);
      if (phone) {
        const smsMsg = `[MaedBet] You were added to the team for ${restaurant.name}. Sign in with ${email} at: ${inviteUrl}`;
        await sendSMS(phone, smsMsg, restaurant.name);
      }
    } catch (e) {
      console.error("[TEAM INVITE NOTIFICATION ERROR]", e.message);
    }

    res.json(restaurant.admins);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// PUT update admin permissions
router.put(
  "/:slug/team/:userId",
  auth,
  verifyOwnerOrManager,
  async (req, res) => {
    const { permissions } = req.body;
    const restaurant = req.restaurant;

    try {
      const adminIndex = restaurant.admins.findIndex(
        (a) => a.user.toString() === req.params.userId,
      );
      if (adminIndex === -1) {
        return res
          .status(404)
          .json({ msg: "Admin not found in this restaurant." });
      }

      restaurant.admins[adminIndex].permissions = permissions;
      await restaurant.save();

      res.json(restaurant.admins);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  },
);

// PUT update admin profile details (name, email, phone)
router.put(
  "/:slug/team/:userId/profile",
  auth,
  verifyOwnerOrManager,
  async (req, res) => {
    const { name, email, phone } = req.body;
    const restaurant = req.restaurant;

    try {
      const adminIndex = restaurant.admins.findIndex(
        (a) => a.user.toString() === req.params.userId,
      );
      if (adminIndex === -1) {
        return res
          .status(404)
          .json({ msg: "Admin not found in this restaurant." });
      }

      // Check if new email is taken by another user
      if (email) {
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser._id.toString() !== req.params.userId) {
          return res
            .status(400)
            .json({ msg: "This email is already in use by another user." });
        }
      }

      const targetUser = await User.findById(req.params.userId);
      if (!targetUser) {
        return res.status(404).json({ msg: "User document not found." });
      }

      if (name) targetUser.name = name;
      if (email) targetUser.email = email;
      if (phone !== undefined) targetUser.phone = phone; // Allow clearing phone

      await targetUser.save();

      res.json({
        msg: "Admin profile updated successfully",
        user: {
          id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          phone: targetUser.phone,
        },
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  },
);

// DELETE remove an admin
router.delete(
  "/:slug/team/:userId",
  auth,
  verifyOwnerOrManager,
  async (req, res) => {
    const restaurant = req.restaurant;

    try {
      restaurant.admins = restaurant.admins.filter(
        (a) => a.user.toString() !== req.params.userId,
      );
      await restaurant.save();

      res.json(restaurant.admins);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  },
);

module.exports = router;
