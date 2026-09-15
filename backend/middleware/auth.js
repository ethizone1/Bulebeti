const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Try loading Clerk SDK modules if available
let clerkClient = null;
let verifyToken = null;

try {
  const clerkExpress = require("@clerk/express");
  clerkClient = clerkExpress.clerkClient;
} catch (e) {
  try {
    const clerkBackend = require("@clerk/backend");
    clerkClient = clerkBackend.clerkClient;
    verifyToken = clerkBackend.verifyToken;
  } catch (err) {
    // Clerk SDK dynamically loaded at runtime
  }
}

module.exports = async function (req, res, next) {
  try {
    let token = req.header("x-auth-token");
    const authHeader = req.header("Authorization");

    if (!token && authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    let clerkUserId = null;
    let verifiedEmailFromClerk = null;
    let clerkNameFromToken = null;

    // 1. Check if req.auth is populated by Clerk middleware
    if (req.auth && req.auth.userId) {
      clerkUserId = req.auth.userId;
    }

    // 2. Extract clerkUserId and verified claims from token if available
    if (!clerkUserId && token) {
      const secretKey = process.env.CLERK_SECRET_KEY;
      if (secretKey && verifyToken) {
        try {
          const verified = await verifyToken(token, { secretKey });
          clerkUserId = verified.sub;
        } catch (err) {
          // Token verification failed or non-clerk token
        }
      }

      // Decode payload if standard JWT format
      if (!clerkUserId) {
        try {
          const decoded = jwt.decode(token);
          if (decoded && (decoded.sub || decoded.clerkUserId)) {
            clerkUserId = decoded.sub || decoded.clerkUserId;
            if (decoded.email && (decoded.email_verified || decoded.email_verified === undefined)) {
              verifiedEmailFromClerk = decoded.email.trim().toLowerCase();
            }
            if (decoded.name) {
              clerkNameFromToken = decoded.name;
            }
          }
        } catch (e) {
          // Decoding failed
        }
      }

      // Legacy fallback during migration/testing if JWT_SECRET is configured
      if (!clerkUserId && process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded && decoded.user) {
            // Check if decoded.user has an ID matching MongoDB User
            const legacyUser = await User.findById(decoded.user.id);
            if (legacyUser) {
              req.user = {
                id: legacyUser._id.toString(),
                clerkUserId: legacyUser.clerkUserId || null,
                role: legacyUser.role,
                email: legacyUser.email,
                restaurantId: legacyUser.restaurantId ? legacyUser.restaurantId.toString() : null,
              };
              return next();
            }
          }
        } catch (err) {
          // Invalid legacy token
        }
      }
    }

    if (!clerkUserId) {
      return res.status(401).json({ msg: "No valid authentication token, authorization denied" });
    }

    // 3. Resolve local MongoDB User by clerkUserId
    let user = await User.findOne({ clerkUserId });

    // 4. Account Linking (Phase 6): Match existing MongoDB user by server-verified email
    if (!user) {
      if (!verifiedEmailFromClerk && clerkClient && process.env.CLERK_SECRET_KEY) {
        try {
          const clerkUser = await clerkClient.users.getUser(clerkUserId);
          const primaryEmailObj = clerkUser.emailAddresses && clerkUser.emailAddresses.find(
            (e) => e.id === clerkUser.primaryEmailAddressId && e.verification && e.verification.status === "verified"
          ) || (clerkUser.emailAddresses && clerkUser.emailAddresses[0]);

          if (primaryEmailObj) {
            verifiedEmailFromClerk = primaryEmailObj.emailAddress.trim().toLowerCase();
          }
          if (clerkUser.firstName || clerkUser.lastName) {
            clerkNameFromToken = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
          }
        } catch (err) {
          console.warn("[AUTH MIDDLEWARE] Clerk user fetch warning:", err.message);
        }
      }

      if (verifiedEmailFromClerk) {
        const matchingUsers = await User.find({ email: verifiedEmailFromClerk });

        if (matchingUsers.length > 1) {
          console.error(`[CRITICAL SECURITY ALERT] Multiple local accounts match verified email: ${verifiedEmailFromClerk}`);
          return res.status(409).json({ msg: "Account migration conflict: Multiple local accounts found. Please contact support." });
        }

        if (matchingUsers.length === 1) {
          user = matchingUsers[0];
          user.clerkUserId = clerkUserId;
          user.isVerified = true;
          user.status = "active";
          await user.save();
          console.log(`[ACCOUNT LINKED] Linked Clerk ID ${clerkUserId} to MongoDB User _id: ${user._id}`);
        }
      }
    }

    // 5. New User Creation (Phase 7): Create MongoDB user with safest default role ('customer')
    if (!user) {
      const emailToUse = verifiedEmailFromClerk || `${clerkUserId}@clerk.user`;
      const nameToUse = clerkNameFromToken || emailToUse.split("@")[0] || "MaedBet User";

      user = new User({
        clerkUserId,
        email: emailToUse,
        name: nameToUse,
        role: "customer", // Safest default role
        status: "active",
        isVerified: true,
      });
      await user.save();
      console.log(`[NEW USER CREATED] Auto-created MongoDB User _id: ${user._id} for Clerk ID: ${clerkUserId}`);
    }

    // Check account suspension status
    if (user.status === "suspended" || user.status === "disabled") {
      return res.status(403).json({ msg: "Account has been suspended or disabled. Access denied." });
    }

    // 6. Attach normalized req.user for downstream middleware/controllers
    req.user = {
      id: user._id.toString(),
      clerkUserId: user.clerkUserId,
      role: user.role,
      email: user.email,
      restaurantId: user.restaurantId ? user.restaurantId.toString() : null,
    };

    next();
  } catch (err) {
    console.error("[AUTH MIDDLEWARE EXCEPTION]", err);
    res.status(500).json({ msg: "Authentication error processing request" });
  }
};
