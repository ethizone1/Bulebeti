const Restaurant = require('../models/Restaurant');

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

// Middleware to verify user is owner or admin of the target restaurant
const requireRestaurantOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: 'Unauthorized: Authentication required' });
    }

    // Super-admins bypass ownership checks
    if (req.user.role === 'super-admin') {
      return next();
    }

    let restaurantId = req.body.restaurantId || req.query.restaurantId || req.params.restaurantId;

    // If restaurant ID is not directly provided, check if restaurantSlug is in params
    if (!restaurantId && req.params.slug) {
      const restaurant = await Restaurant.findOne({ slug: req.params.slug });
      if (restaurant) {
        restaurantId = restaurant._id.toString();
      }
    }

    // If restaurant ID is in params as 'id' and route is for /api/restaurants/:id
    if (!restaurantId && req.params.id && req.baseUrl === '/api/restaurants') {
      restaurantId = req.params.id;
    }

    if (!restaurantId) {
      // If no explicit restaurant ID found, proceed (or rely on route-level check)
      return next();
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ msg: 'Restaurant not found' });
    }

    const isOwner = restaurant.ownerId.toString() === req.user.id;
    const isAdmin = restaurant.admins && restaurant.admins.some(a => a.user && a.user.toString() === req.user.id);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ msg: 'Forbidden: You do not have management access for this restaurant' });
    }

    req.restaurant = restaurant;
    next();
  } catch (err) {
    console.error('[OWNERSHIP MIDDLEWARE ERROR]', err.message);
    res.status(500).json({ msg: 'Internal server error verifying authorization' });
  }
};

module.exports = { requireRole, requireRestaurantOwnership };
