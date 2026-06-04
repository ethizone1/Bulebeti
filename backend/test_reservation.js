const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const Reservation = require('./models/Reservation');
require('dotenv').config();

async function testApi() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const restaurant = await Restaurant.findOne();
  if (!restaurant) {
    console.log('No restaurants found in DB. Run seed first.');
    process.exit(1);
  }

  const payload = {
    restaurantId: restaurant._id,
    guestName: 'API Test User',
    email: 'add.belaye@gmail.com',
    phone: '5713429228',
    date: '2026-12-25',
    time: '19:00',
    guests: 4,
    specialRequests: 'Testing the API'
  };

  console.log('Sending POST to http://localhost:5000/api/reservations ...');
  
  try {
    const res = await fetch('http://localhost:5000/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log('API Response:', res.status, data);
  } catch (err) {
    console.error('Fetch error:', err);
  }

  process.exit(0);
}

testApi();
