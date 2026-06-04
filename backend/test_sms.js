require('dotenv').config();
const { sendSMS } = require('./services/notifications');

async function test() {
  const phone = process.argv[2];
  if (!phone) {
    console.log('Please provide a phone number! Usage: node test_sms.js 5551234567');
    process.exit(1);
  }

  console.log(`Sending test SMS to: ${phone}`);
  console.log(`Using gateway mode: ${process.env.DEFAULT_SMS_GATEWAY}`);

  try {
    const success = await sendSMS(phone, 'BuleBet Test: If you receive this, the SMS system is working perfectly!');
    console.log('Result:', success ? 'SUCCESS - Check your phone!' : 'FAILED');
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
