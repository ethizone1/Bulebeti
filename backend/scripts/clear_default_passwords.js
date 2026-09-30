// One-time cleanup: finds accounts whose password is one of the defaults that
// were published in this repository, and removes that password so the account
// must sign in through Clerk (email code) or set a new password.
//
// Usage (from backend/):
//   node scripts/clear_default_passwords.js           # dry run, lists matches
//   node scripts/clear_default_passwords.js --apply   # clears the passwords

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const LEAKED_PASSWORDS = ["password123", "bulebeti@Ethiopia.2019", "Password.123"];
const apply = process.argv.includes("--apply");

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri);

  const users = await User.find({ password: { $exists: true, $ne: null } }).select("email role password");
  const matches = [];

  for (const user of users) {
    for (const leaked of LEAKED_PASSWORDS) {
      if (await bcrypt.compare(leaked, user.password)) {
        matches.push(user);
        break;
      }
    }
  }

  console.log(`Checked ${users.length} accounts; ${matches.length} use a published default password.`);
  for (const user of matches) console.log(` - ${user.email} (${user.role})`);

  if (apply && matches.length) {
    await User.updateMany({ _id: { $in: matches.map((u) => u._id) } }, { $unset: { password: 1 } });
    console.log("Passwords cleared. These users can sign in with an email code.");
  } else if (matches.length) {
    console.log("Dry run only. Re-run with --apply to clear these passwords.");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
