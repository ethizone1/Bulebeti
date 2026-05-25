const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Global Activity Logger
app.use((req, res, next) => {
  console.log(`[ACTIVITY] ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/restaurants', require('./routes/team'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/catering', require('./routes/catering'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/events', require('./routes/events'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/gallery', require('./routes/gallery'));

// Basic Route
app.get('/', (req, res) => {
  res.send('BuleBet Backend API is running!');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bulebet')
.then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Trigger restart
