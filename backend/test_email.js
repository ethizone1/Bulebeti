require("dotenv").config();
const { sendEmail } = require("./services/notifications");

async function test() {
  console.log("Testing with EMAIL_USER:", process.env.EMAIL_USER);
  try {
    const success = await sendEmail(
      process.env.EMAIL_USER, // send to self
      "Test Email from bulebeti",
      "<h1>This is a test email</h1><p>If you see this, the email integration is working!</p>",
    );
    console.log("Result:", success ? "SUCCESS" : "FAILED");
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
