const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

dotenv.config();

// Startup Environment Validation
const isProduction = process.env.NODE_ENV === "production";
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error("❌ [FATAL SECURITY ERROR] JWT_SECRET is not set in environment variables!");
  if (isProduction) process.exit(1);
}

if (!mongoUri && isProduction) {
  console.error("❌ [FATAL ERROR] MONGODB_URI is required in production mode!");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers (Helmet)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  process.env.FRONTEND_URL,
  "https://bulebeti.com",
  "https://www.bulebeti.com",
  "http://bulebeti.com",
  "http://www.bulebeti.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, "");

      const isExplicitlyAllowed = allowedOrigins.some(
        (allowed) => allowed === "*" || allowed.replace(/\/$/, "") === cleanOrigin
      );

      const isDomainMatch =
        cleanOrigin.endsWith(".bulebeti.com") ||
        cleanOrigin === "https://bulebeti.com" ||
        cleanOrigin === "http://bulebeti.com";

      if (isExplicitlyAllowed || isDomainMatch || !isProduction) {
        return callback(null, true);
      }

      console.warn(`[CORS BLOCKED] Origin not allowed: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  })
);


// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction,
  message: { msg: "Too many requests from this IP, please try again after 15 minutes." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Limit each IP to 100 auth requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction,
  message: { msg: "Too many authentication attempts, please try again after 15 minutes." },
});

app.use("/api/", generalLimiter);
app.use("/api/auth", authLimiter);

// Payload Parsers (Restricted payload size to prevent DoS)
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

// Activity Logging (Sanitizing output)
app.use((req, res, next) => {
  console.log(`[ACTIVITY] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/restaurants", require("./routes/team"));
app.use("/api/restaurants", require("./routes/restaurants"));
app.use("/api/menu", require("./routes/menu"));
app.use("/api/catering", require("./routes/catering"));
app.use("/api/reservations", require("./routes/reservations"));
app.use("/api/testimonials", require("./routes/testimonials"));
app.use("/api/events", require("./routes/events"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/feedback", require("./routes/feedback"));
app.use("/api/locations", require("./routes/locations"));
app.use("/api/gallery", require("./routes/gallery"));
app.use("/api/inquiries", require("./routes/inquiries"));

// Production Health Check Routes
app.get(["/", "/api/health"], (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.status(200).json({
    status: "healthy",
    service: "Bulebet Backend API",
    environment: process.env.NODE_ENV || "development",
    database: dbStatus,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Global Centralized Error Handler (No stack trace leaks)
app.use((err, req, res, next) => {
  console.error("[GLOBAL ERROR LOG]", err.stack || err.message);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    msg: err.message || "An unexpected error occurred.",
  });
});

// Global Process Level Crash Safety Guards
process.on("unhandledRejection", (reason, promise) => {
  console.error("[UNHANDLED REJECTION]", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[UNCAUGHT EXCEPTION]", error);
});

// Connect to MongoDB & Start Server
const finalMongoUri = mongoUri || "mongodb://localhost:27017/bulebeti";

mongoose
  .connect(finalMongoUri)
  .then(async () => {
    console.log("✅ Connected to MongoDB successfully");
    const autoSeed = require("./services/autoSeed");
    await autoSeed();
    app.listen(PORT, () => {
      console.log(`🚀 Bulebet API Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
