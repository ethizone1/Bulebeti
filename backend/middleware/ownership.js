const Restaurant = require('../models/Restaurant');

// Helper to check if a user is owner, admin, or super-admin for a specific restaurant
const canManageRestaurant = async (userId, userRole, restaurantId) => {
  // Only platform-level super-admin or sub-admin can bypass tenant isolation globally
  if (userRole === 'super-admin' || userRole === 'sub-admin') return true;
  if (!restaurantId) return false;
  
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return false;
  
  // Verify explicit ownership or administrator assignment for target restaurant
  const isOwner = restaurant.ownerId && restaurant.ownerId.toString() === userId;
  const isAdmin = restaurant.admins && restaurant.admins.some(a => a.user && a.user.toString() === userId);
  return isOwner || isAdmin;
};

// Middleware to restrict access based on user role(s)
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: 'Unauthorized: Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};

// Middleware to verify user is owner or assigned admin of the target restaurant
const requireRestaurantOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: 'Unauthorized: Authentication required' });
    }

    // Only platform super-admin and sub-admin bypass tenant-level checks
    if (req.user.role === 'super-admin' || req.user.role === 'sub-admin') {
      return next();
    }

    let restaurantId = req.body.restaurantId || req.query.restaurantId || req.params.restaurantId;

    if (!restaurantId && req.params.slug) {
      const restaurant = await Restaurant.findOne({ slug: req.params.slug });
      if (restaurant) {
        restaurantId = restaurant._id.toString();
      }
    }

    if (!restaurantId && req.params.id && req.baseUrl === '/api/restaurants') {
      restaurantId = req.params.id;
    }

    // Fallback to user's registered restaurantId if present
    if (!restaurantId && req.user.restaurantId) {
      restaurantId = req.user.restaurantId;
    }

    if (!restaurantId) {
      return res.status(400).json({ msg: 'Bad Request: Restaurant identifier required for tenant verification' });
    }

    const hasAccess = await canManageRestaurant(req.user.id, req.user.role, restaurantId);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Forbidden: You do not have management access for this restaurant' });
    }

    next();
  } catch (err) {
    console.error('[OWNERSHIP MIDDLEWARE ERROR]', err.message);
    res.status(500).json({ msg: 'Internal server error verifying authorization' });
  }
};

module.exports = { canManageRestaurant, requireRole, requireRestaurantOwnership };
