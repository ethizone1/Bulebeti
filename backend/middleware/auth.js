const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Get token from header (x-auth-token or Bearer token)
  let token = req.header("x-auth-token");
  const authHeader = req.header("Authorization");

  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  if (!process.env.JWT_SECRET) {
    console.error("[FATAL SECURITY ERROR] JWT_SECRET environment variable is missing!");
    return res.status(500).json({ msg: "Server configuration error" });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is invalid or expired" });
  }
};
