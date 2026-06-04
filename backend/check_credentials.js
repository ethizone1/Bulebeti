require('dotenv').config();
const nodemailer = require('nodemailer');

async function test() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  console.log('Testing SMTP connection for:', process.env.EMAIL_USER);
  
  try {
    const success = await transporter.verify();
    console.log('✅ SMTP connection successful! Credentials are correct.');
  } catch (err) {
    console.error('❌ SMTP verification failed!');
    console.error(err);
  }
}

test();
