const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/ownership");
const Restaurant = require("../models/Restaurant");
const Inquiry = require("../models/Inquiry");

// Get all restaurants
router.get("/", async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .populate("ownerId", "name email")
      .sort({ createdAt: -1 });
    res.json(restaurants);
  } catch (err) {
    console.error("[GET RESTAURANTS ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get all restaurants owned by the logged-in user or where user is an admin
router.get("/owner/my", auth, async (req, res) => {
  try {
    const restaurants = await Restaurant.find({
      $or: [{ ownerId: req.user.id }, { "admins.user": req.user.id }],
    });
    res.json(restaurants);
  } catch (err) {
    console.error("[GET MY RESTAURANTS ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get sister restaurants for a given restaurant slug
router.get("/:slug/sisters", async (req, res) => {
  try {
    const slugParam = (req.params.slug || "").trim();
    const escapedSlug = slugParam.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

    const restaurant = await Restaurant.findOne({
      $or: [
        { slug: slugParam.toLowerCase() },
        { slug: { $regex: new RegExp(`^${escapedSlug}$`, "i") } },
      ],
    });

    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    // Find other active restaurants owned by the same owner
    const sisterRestaurants = await Restaurant.find({
      ownerId: restaurant.ownerId,
      _id: { $ne: restaurant._id },
      status: "Active",
    });

    res.json({ mainRestaurant: restaurant, sisterRestaurants });
  } catch (err) {
    console.error("[GET SISTER RESTAURANTS ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get restaurant by slug
router.get("/:slug", async (req, res) => {
  try {
    const slugParam = (req.params.slug || "").trim();
    const escapedSlug = slugParam.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

    let restaurant = await Restaurant.findOne({
      $or: [
        { slug: slugParam.toLowerCase() },
        { slug: { $regex: new RegExp(`^${escapedSlug}$`, "i") } },
        { name: { $regex: new RegExp(`^${escapedSlug}$`, "i") } },
      ],
    });

    if (!restaurant && slugParam.match(/^[0-9a-fA-F]{24}$/)) {
      restaurant = await Restaurant.findById(slugParam);
    }

    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }
    res.json(restaurant);
  } catch (err) {
    console.error("[GET RESTAURANT SLUG ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Create a restaurant (requires auth)
router.post("/", auth, async (req, res) => {
  const {
    name,
    slug,
    description,
    address,
    lat,
    lng,
    phone,
    email,
    menuLayout,
    logoUrl,
    subscriptionTier,
  } = req.body;

  try {
    // Check if restaurant with the same slug already exists
    const existing = await Restaurant.findOne({
      slug: { $regex: new RegExp(`^${slug}$`, "i") },
    });
    if (existing) {
      return res
        .status(400)
        .json({ msg: "A restaurant with this name or slug already exists." });
    }

    // Check sister restaurant limits
    const userRestaurants = await Restaurant.find({ ownerId: req.user.id });
    if (userRestaurants.length > 0) {
      let highestTier = "Basic";
      const tierRank = {
        Basic: 0,
        Silver: 1,
        Gold: 2,
        Platinum: 3,
        Premium: 4,
      };

      userRestaurants.forEach((r) => {
        const t =
          r.subscriptionTier === "Basic"
            ? "Silver"
            : r.subscriptionTier || "Platinum";
        if (tierRank[t] > tierRank[highestTier]) {
          highestTier = t;
        }
      });

      let maxAllowed = 1; // Default for Silver/Gold
      if (highestTier === "Platinum") maxAllowed = 4; // 1 main + 3 sisters
      if (highestTier === "Premium") maxAllowed = 8; // 1 main + 7 sisters

      if (userRestaurants.length >= maxAllowed) {
        return res.status(403).json({
          msg: `You have reached the maximum number of sister restaurants for your ${highestTier} plan. Please upgrade to add more.`,
        });
      }
    }

    const initialTier = (req.user && req.user.role === "super-admin") ? (subscriptionTier || "Basic") : "Basic";

    const newRestaurant = new Restaurant({
      name,
      slug,
      description,
      address,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      phone,
      email,
      menuLayout,
      logoUrl,
      subscriptionTier: initialTier,
      ownerId: req.user.id,
    });

    const restaurant = await newRestaurant.save();
    console.log(
      `[BACKEND] 🏢 New restaurant profile created: ${name} (slug: ${slug}) by User ID: ${req.user.id} with tier: ${initialTier}`,
    );
    res.json(restaurant);
  } catch (err) {
    console.error("[CREATE RESTAURANT ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Request plan upgrade (requires auth, owner check)
router.put("/:slug/request-upgrade", auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug });
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    // Verify owner
    if (restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Forbidden: You are not authorized for this restaurant" });
    }

    const { tier } = req.body;
    if (!["Silver", "Gold", "Platinum", "Premium"].includes(tier)) {
      return res
        .status(400)
        .json({ msg: "Invalid subscription tier requested" });
    }

    restaurant.pendingTierRequest = tier;
    await restaurant.save();
    console.log(
      `[BACKEND] 🎫 Upgrade to ${tier} requested for restaurant: ${restaurant.name}`,
    );
    res.json(restaurant);
  } catch (err) {
    console.error("[REQUEST UPGRADE ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Admin endpoint to approve or reject/update any restaurant's tier directly (requires admin auth)
router.put("/admin/upgrade/:id", auth, requireRole("admin", "super-admin"), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    const { action, subscriptionTier, clearPending } = req.body;
    let targetTier = subscriptionTier || restaurant.pendingTierRequest || "Platinum";

    if (action === "approve") {
      restaurant.subscriptionTier = targetTier;
      restaurant.pendingTierRequest = "";
      await restaurant.save();

      try {
        const congratsInquiry = new Inquiry({
          name: "Super Admin Platform System",
          email: "admin@bulebeti.com",
          subject: "🎉 Subscription Upgrade Approved!",
          message: `Congratulations! Your request to upgrade ${restaurant.name} to the ${targetTier} Plan has been APPROVED by the Super Admin team. All features of the ${targetTier} Plan are now fully unlocked for your hub!`,
          status: "Resolved",
          restaurantId: restaurant._id,
        });
        await congratsInquiry.save();
      } catch (inqErr) {
        console.error("Failed to create congratulatory inquiry:", inqErr.message);
      }

      console.log(`[BACKEND] 👑 Upgrade APPROVED for ${restaurant.name} to ${targetTier}`);
      return res.json({ msg: `Successfully upgraded ${restaurant.name} to ${targetTier}!`, restaurant });
    } else if (action === "reject") {
      const requestedTier = restaurant.pendingTierRequest || "requested tier";
      restaurant.pendingTierRequest = "";
      await restaurant.save();

      try {
        const rejectionInquiry = new Inquiry({
          name: "Super Admin Platform System",
          email: "admin@bulebeti.com",
          subject: "Subscription Upgrade Request Status",
          message: `Your request to upgrade ${restaurant.name} to the ${requestedTier} Plan was reviewed by the Super Admin team and not approved at this time. Please contact support@bulebeti.com for further details.`,
          status: "Resolved",
          restaurantId: restaurant._id,
        });
        await rejectionInquiry.save();
      } catch (inqErr) {
        console.error("Failed to create rejection inquiry:", inqErr.message);
      }

      console.log(`[BACKEND] 👑 Upgrade REJECTED for ${restaurant.name}`);
      return res.json({ msg: `Upgrade request for ${restaurant.name} has been rejected.`, restaurant });
    }

    if (subscriptionTier) restaurant.subscriptionTier = subscriptionTier;
    if (clearPending) restaurant.pendingTierRequest = "";

    await restaurant.save();
    console.log(
      `[BACKEND] 👑 Admin updated restaurant ${restaurant.name} subscription tier to: ${restaurant.subscriptionTier}`,
    );
    res.json({ msg: "Restaurant updated", restaurant });
  } catch (err) {
    console.error("[ADMIN UPGRADE ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Admin endpoint to edit restaurant details (requires admin auth)
router.put("/admin/edit/:id", auth, requireRole("admin", "super-admin"), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    const {
      name,
      slug,
      description,
      address,
      phone,
      email,
      menuLayout,
      subscriptionTier,
      status,
    } = req.body;
    if (name) restaurant.name = name;
    if (slug) restaurant.slug = slug;
    if (description !== undefined) restaurant.description = description;
    if (address) restaurant.address = address;
    if (phone) restaurant.phone = phone;
    if (email !== undefined) restaurant.email = email;
    if (menuLayout) restaurant.menuLayout = menuLayout;
    if (subscriptionTier) restaurant.subscriptionTier = subscriptionTier;
    if (status) restaurant.status = status;

    await restaurant.save();
    console.log(`[BACKEND] 👑 Admin edited restaurant ${restaurant.name}`);
    res.json(restaurant);
  } catch (err) {
    console.error("[ADMIN EDIT ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Update restaurant (requires auth and owner check)
router.put("/:slug", auth, async (req, res) => {
  try {
    let restaurant = await Restaurant.findOne({ slug: req.params.slug });
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    // Verify owner or admin
    const isOwner = restaurant.ownerId.toString() === req.user.id;
    const isAdmin = restaurant.admins && restaurant.admins.some(a => a.user && a.user.toString() === req.user.id);
    const isSuperAdmin = req.user.role === "super-admin";

    if (!isOwner && !isAdmin && !isSuperAdmin) {
      return res.status(403).json({ msg: "Forbidden: You are not authorized to update this restaurant" });
    }

    // Update fields
    const {
      name,
      description,
      address,
      phone,
      email,
      menuLayout,
      logoUrl,
      bannerUrl,
      subscriptionTier,
      openingHours,
      socialLinks,
    } = req.body;

    if (name) restaurant.name = name;
    if (description !== undefined) restaurant.description = description;
    if (address !== undefined) restaurant.address = address;
    if (phone !== undefined) restaurant.phone = phone;
    if (email !== undefined) restaurant.email = email;
    if (menuLayout) restaurant.menuLayout = menuLayout;
    if (logoUrl !== undefined) restaurant.logoUrl = logoUrl;
    if (bannerUrl !== undefined) restaurant.bannerUrl = bannerUrl;
    if (openingHours !== undefined) restaurant.openingHours = openingHours;
    if (socialLinks !== undefined) restaurant.socialLinks = socialLinks;
    if (subscriptionTier && isSuperAdmin) restaurant.subscriptionTier = subscriptionTier;

    await restaurant.save();
    console.log(
      `[BACKEND] 🏢 Restaurant profile updated: ${restaurant.name} (slug: ${req.params.slug})`,
    );
    res.json(restaurant);
  } catch (err) {
    console.error("[UPDATE RESTAURANT ERROR]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
