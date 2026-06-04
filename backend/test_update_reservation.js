const mongoose = require('mongoose');
const Reservation = require('./models/Reservation');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testPut() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.log('No admin found');
    process.exit(1);
  }

  const payload = {
    user: { id: admin.id, role: admin.role }
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

  const reservation = await Reservation.findOne();
  if (!reservation) {
    console.log('No reservation found');
    process.exit(1);
  }

  console.log(`Sending PUT to update reservation ${reservation._id} to 'Completed'...`);
  
  try {
    const res = await fetch(`http://localhost:5000/api/reservations/${reservation._id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ status: 'Completed' })
    });
    
    const text = await res.text();
    console.log(`API Response: ${res.status} ${res.statusText}`);
    console.log('Body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }

  process.exit(0);
}

testPut();
