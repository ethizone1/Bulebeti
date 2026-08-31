// bulebeti Notification Service
// Uses Nodemailer (Gmail) for both Email AND SMS (via email-to-SMS gateways)
// Configure credentials in backend/.env

const nodemailer = require("nodemailer");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Strip all non-digit characters from a phone number
const cleanPhone = (phone) => (phone || "").replace(/\D/g, "");

// Common email-to-SMS carrier gateways (US-based mostly)
// For Ethiopian numbers or other carriers, the DEFAULT_SMS_GATEWAY in .env must be set
const CARRIER_GATEWAYS = {
  // US Carriers
  att: "txt.att.net",
  tmobile: "tmomail.net",
  verizon: "vtext.com",
  sprint: "messaging.sprintpcs.com",
  boost: "sms.myboostmobile.com",
  cricket: "mms.cricketwireless.net",
  uscellular: "email.uscc.net",
};

// Build the SMS email address from phone + gateway domain
const buildSmsEmail = (phone, gatewayDomain) => {
  const digits = cleanPhone(phone);
  if (!digits || digits.length < 7 || !gatewayDomain) return null;
  const local = digits.length >= 10 ? digits.slice(-10) : digits;
  return `${local}@${gatewayDomain}`;
};

// ─── Create transporter ──────────────────────────────────────────────────────
const getTransporter = () => {
  if (
    !process.env.EMAIL_USER ||
    process.env.EMAIL_USER.includes("your_gmail")
  ) {
    return null;
  }
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ─── sendEmail ───────────────────────────────────────────────────────────────
const sendEmail = async (
  toEmail,
  subject,
  htmlContent,
  senderName = "bulebeti",
) => {
  try {
    const transporter = getTransporter();

    if (!transporter) {
      console.log(
        `\n📧 EMAIL [NOT SENT — no credentials]: TO: ${toEmail} | ${subject}\n`,
      );
      return false;
    }

    await transporter.sendMail({
      from: `"${senderName}" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      html: htmlContent,
    });
    console.log(`✅ Email sent → ${toEmail}`);
    return true;
  } catch (err) {
    console.error(`❌ Email failed → ${toEmail}:`, err.message);
    return false;
  }
};

const sendSMS = async (toPhone, textMessage, senderName = "bulebeti") => {
  const transporter = getTransporter();
  const gateway = process.env.DEFAULT_SMS_GATEWAY;

  if (!transporter) {
    console.log(
      `\n📱 SMS [NOT SENT — no email credentials]: TO: ${toPhone}\n${textMessage}\n`,
    );
    return false;
  }

  if (!gateway) {
    console.log(
      `\n📱 SMS [NOT SENT — no DEFAULT_SMS_GATEWAY set in .env]: TO: ${toPhone}\nMESSAGE: ${textMessage}\n`,
    );
    return false;
  }

  const gatewaysToUse =
    gateway.toLowerCase() === "all"
      ? Object.values(CARRIER_GATEWAYS)
      : [gateway];

  let sent = false;

  for (const gw of gatewaysToUse) {
    const smsEmail = buildSmsEmail(toPhone, gw);
    if (!smsEmail) continue;

    try {
      await transporter.sendMail({
        from: `"${senderName}" <${process.env.EMAIL_USER}>`,
        to: smsEmail,
        subject: "", // Subject is ignored by SMS gateways
        text: textMessage, // Plain text only for SMS
      });
      console.log(`✅ SMS sent via email gateway → ${smsEmail}`);
      sent = true;
    } catch (err) {
      console.error(`❌ SMS gateway send failed → ${smsEmail}:`, err.message);
    }
  }

  return sent;
};

const notifyAdminAndCustomer = async (
  adminEmail,
  adminPhone,
  customerEmail,
  customerPhone,
  type,
  details,
) => {
  let customerSubject,
    adminSubject,
    customerHtml,
    adminHtml,
    customerSms,
    adminSms;

  if (type === "Reservation") {
    customerSubject = `[${details.restaurantName}] - Reservation Received`;
    adminSubject = `[${details.restaurantName}] Admin - New Reservation Request: ${details.guestName}`;

    customerHtml = `
      <h2>Hi ${details.guestName},</h2>
      <p>Thank you for submitting a reservation request at <strong>${details.restaurantName}</strong>.</p>
      <ul>
        <li><strong>Date:</strong> ${details.date}</li>
        <li><strong>Time:</strong> ${details.time}</li>
        <li><strong>Guests:</strong> ${details.guests}</li>
        <li><strong>Special Requests:</strong> ${details.specialRequests || "None"}</li>
      </ul>
      <p>The restaurant will review your request and confirm your table shortly.</p>
    `;

    adminHtml = `
      <h2>New Reservation Request</h2>
      <p><strong>Customer:</strong> ${details.guestName} (${customerEmail} | ${customerPhone})</p>
      <ul>
        <li><strong>Date:</strong> ${details.date}</li>
        <li><strong>Time:</strong> ${details.time}</li>
        <li><strong>Guests:</strong> ${details.guests}</li>
        <li><strong>Special Requests:</strong> ${details.specialRequests || "None"}</li>
      </ul>
      <p>Please log in to your Admin Dashboard to confirm or reject this request.</p>
    `;

    customerSms = `[${details.restaurantName}]: Your reservation request for ${details.date} at ${details.time} has been received! The restaurant will confirm shortly.`;
    adminSms = `[${details.restaurantName}] Admin Alert: New Reservation for ${details.guests} guests on ${details.date} at ${details.time}. Name: ${details.guestName}. Check Dashboard.`;
  } else if (type === "Catering") {
    customerSubject = `[${details.restaurantName}] - Catering Inquiry Received`;
    adminSubject = `[${details.restaurantName}] Admin - New Catering Inquiry: ${details.eventType}`;

    customerHtml = `
      <h2>Hi ${details.name},</h2>
      <p>We have received your catering inquiry for your upcoming ${details.eventType} event.</p>
      <ul>
        <li><strong>Date:</strong> ${details.date}</li>
        <li><strong>Location:</strong> ${details.location}</li>
        <li><strong>Guests:</strong> ${details.guestCount}</li>
      </ul>
      <p>Our events team will contact you shortly to discuss menu options and a quote.</p>
    `;

    adminHtml = `
      <h2>New Catering Inquiry</h2>
      <p><strong>Customer:</strong> ${details.name} (${customerEmail} | ${customerPhone})</p>
      <ul>
        <li><strong>Event Type:</strong> ${details.eventType}</li>
        <li><strong>Date:</strong> ${details.date}</li>
        <li><strong>Location:</strong> ${details.location}</li>
        <li><strong>Guests:</strong> ${details.guestCount}</li>
        <li><strong>Additional Details:</strong> ${details.details || "None"}</li>
      </ul>
      <p>Please log in to your Admin Dashboard to follow up with this client.</p>
    `;

    customerSms = `[${details.restaurantName}]: Your catering inquiry for your ${details.eventType} event has been received. Our team will contact you soon.`;
    adminSms = `[${details.restaurantName}] Admin Alert: New Catering Inquiry for a ${details.eventType} (${details.guestCount} guests). Name: ${details.name}. Check Dashboard.`;
  } else if (type === "Order") {
    customerSubject = `[${details.restaurantName}] - Order Confirmed #${details.orderId || "ONLINE"}`;
    adminSubject = `[${details.restaurantName}] Admin Alert - New Online Order #${details.orderId || "ONLINE"} from ${details.customerName}`;

    customerHtml = `
      <h2>Hi ${details.customerName},</h2>
      <p>Thank you for your order at <strong>${details.restaurantName}</strong>!</p>
      <ul>
        <li><strong>Order Type:</strong> ${details.orderType}</li>
        <li><strong>Total Amount:</strong> $${details.totalPrice}</li>
        <li><strong>Items:</strong> ${details.itemsSummary}</li>
        <li><strong>Contact Phone:</strong> ${customerPhone}</li>
      </ul>
      <p>Both you and the restaurant owner have received this notification. The restaurant will prepare your order shortly.</p>
    `;

    adminHtml = `
      <h2>New Online Order Alert!</h2>
      <p><strong>Customer:</strong> ${details.customerName} (${customerEmail} | ${customerPhone})</p>
      <ul>
        <li><strong>Order Type:</strong> ${details.orderType}</li>
        <li><strong>Total Amount:</strong> $${details.totalPrice}</li>
        <li><strong>Items:</strong> ${details.itemsSummary}</li>
        <li><strong>Notes / Details:</strong> ${details.notes || "None"}</li>
      </ul>
      <p>Please review and confirm this order with the customer.</p>
    `;

    customerSms = `[${details.restaurantName}]: Your ${details.orderType} order ($${details.totalPrice}) has been submitted! Both you and the owner received this confirmation.`;
    adminSms = `[${details.restaurantName}] Admin Alert: New ${details.orderType} Order ($${details.totalPrice}) from ${details.customerName} (${customerPhone}). Items: ${details.itemsSummary}`;
  }

  // 1. Notify Customer
  await sendEmail(
    customerEmail,
    customerSubject,
    customerHtml,
    details.restaurantName,
  );
  if (customerPhone && customerPhone !== "N/A") {
    await sendSMS(customerPhone, customerSms, details.restaurantName);
  }

  // 2. Notify Admin
  if (adminEmail)
    await sendEmail(
      adminEmail,
      adminSubject,
      adminHtml,
      details.restaurantName,
    );
  if (adminPhone && adminPhone !== "N/A")
    await sendSMS(adminPhone, adminSms, details.restaurantName);
};

// ─── STATUS UPDATE NOTIFICATIONS ────────────────────────────────────────────
// Called when the admin changes the status of a reservation or catering request
const notifyStatusUpdate = async (
  type,
  newStatus,
  customerEmail,
  customerPhone,
  details,
) => {
  let subject = "";
  let html = "";
  let sms = "";

  const statusEmoji = {
    Confirmed: "✅",
    Cancelled: "❌",
    Completed: "🎉",
    "Quote Sent": "📄",
    Booked: "📅",
    Pending: "⏳",
  };
  const emoji = statusEmoji[newStatus] || "ℹ️";

  if (type === "Reservation") {
    const { restaurantName, guestName, date, time, guests, specialRequests } =
      details;

    const messages = {
      Confirmed: {
        headline: `Your table is confirmed! ${emoji}`,
        body: `Great news, <strong>${guestName}</strong>! Your reservation at <strong>${restaurantName}</strong> has been <strong>confirmed</strong>.`,
        note: "We look forward to welcoming you. Please arrive on time. If you need to make changes, contact the restaurant directly.",
        smsText: `[${restaurantName}] ✅ Your reservation on ${date} at ${time} is CONFIRMED! See you there.`,
      },
      Cancelled: {
        headline: `Reservation Cancelled ${emoji}`,
        body: `Hi <strong>${guestName}</strong>, we're sorry to let you know that your reservation at <strong>${restaurantName}</strong> has been <strong>cancelled</strong>.`,
        note: "If you believe this is a mistake or would like to rebook, please contact the restaurant directly.",
        smsText: `[${restaurantName}] ❌ Your reservation on ${date} has been cancelled. Please contact the restaurant if you need help.`,
      },
      Completed: {
        headline: `Thank you for dining with us! ${emoji}`,
        body: `Hi <strong>${guestName}</strong>, your visit to <strong>${restaurantName}</strong> has been marked as <strong>completed</strong>.`,
        note: "We hope you had a wonderful experience. We would love to have you back!",
        smsText: `[${restaurantName}] 🎉 Thanks for dining with us! We hope to see you again soon.`,
      },
    };

    const msg = messages[newStatus];
    if (!msg) return; // Don't send for Pending (no update needed)

    subject = `${emoji} Reservation Update — ${restaurantName}`;
    html = `
      <div style="font-family: sans-serif; max-width: 560px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #1f2937; padding: 24px; text-align: center;">
          <h2 style="color: #D4AF37; margin: 0;">${restaurantName}</h2>
          <p style="color: #9ca3af; margin: 4px 0 0; font-size: 13px;">Powered by bulebeti</p>
        </div>
        <div style="padding: 28px;">
          <h3 style="margin-top: 0;">${msg.headline}</h3>
          <p>${msg.body}</p>
          <div style="background: #f9fafb; border-left: 4px solid #D4AF37; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>📍 Restaurant:</strong> ${restaurantName}</p>
            <p style="margin: 4px 0;"><strong>📅 Date:</strong> ${date}</p>
            <p style="margin: 4px 0;"><strong>🕐 Time:</strong> ${time}</p>
            <p style="margin: 4px 0;"><strong>👥 Guests:</strong> ${guests}</p>
            ${specialRequests ? `<p style="margin: 4px 0;"><strong>📝 Special Requests:</strong> ${specialRequests}</p>` : ""}
          </div>
          <p style="color: #6b7280; font-size: 13px;">${msg.note}</p>
        </div>
        <div style="background: #f3f4f6; padding: 14px; text-align: center; font-size: 12px; color: #9ca3af;">
          © bulebeti Platform — This is an automated message.
        </div>
      </div>
    `;
    sms = msg.smsText;
  } else if (type === "Catering") {
    const { restaurantName, name, eventType, date, location, guestCount } =
      details;

    const messages = {
      Confirmed: {
        headline: `Catering Request Confirmed! ${emoji}`,
        body: `Great news, <strong>${name}</strong>! Your catering request for a <strong>${eventType}</strong> event with <strong>${restaurantName}</strong> has been <strong>confirmed</strong>.`,
        note: "Our events team will be in touch with the final details and arrangements.",
        smsText: `[${restaurantName}] ✅ Your catering for a ${eventType} event on ${date} is CONFIRMED!`,
      },
      "Quote Sent": {
        headline: `Your Quote is Ready! ${emoji}`,
        body: `Hi <strong>${name}</strong>, <strong>${restaurantName}</strong> has sent a quote for your upcoming <strong>${eventType}</strong> event.`,
        note: "Please check your email or contact the restaurant directly to review and approve the quote.",
        smsText: `[${restaurantName}] 📄 We have sent a quote for your ${eventType} event. Please check your email.`,
      },
      Booked: {
        headline: `Your Event is Booked! ${emoji}`,
        body: `Congratulations, <strong>${name}</strong>! Your <strong>${eventType}</strong> catering event with <strong>${restaurantName}</strong> is now officially <strong>booked</strong>.`,
        note: "Our team will reach out soon to finalize menu selections and logistics.",
        smsText: `[${restaurantName}] 📅 Your ${eventType} catering event on ${date} is officially BOOKED!`,
      },
      Cancelled: {
        headline: `Catering Request Cancelled ${emoji}`,
        body: `Hi <strong>${name}</strong>, we're sorry to inform you that your catering inquiry for a <strong>${eventType}</strong> event has been <strong>cancelled</strong>.`,
        note: "If this was a mistake or you wish to rebook, please contact the restaurant directly.",
        smsText: `[${restaurantName}] ❌ Your catering request for a ${eventType} event on ${date} has been cancelled.`,
      },
    };

    const msg = messages[newStatus];
    if (!msg) return;

    subject = `${emoji} Catering Update — ${restaurantName}`;
    html = `
      <div style="font-family: sans-serif; max-width: 560px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #1f2937; padding: 24px; text-align: center;">
          <h2 style="color: #D4AF37; margin: 0;">${restaurantName}</h2>
          <p style="color: #9ca3af; margin: 4px 0 0; font-size: 13px;">Powered by bulebeti</p>
        </div>
        <div style="padding: 28px;">
          <h3 style="margin-top: 0;">${msg.headline}</h3>
          <p>${msg.body}</p>
          <div style="background: #f9fafb; border-left: 4px solid #D4AF37; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>🎉 Event Type:</strong> ${eventType}</p>
            <p style="margin: 4px 0;"><strong>📅 Date:</strong> ${date}</p>
            <p style="margin: 4px 0;"><strong>📍 Location:</strong> ${location}</p>
            <p style="margin: 4px 0;"><strong>👥 Guests:</strong> ${guestCount}</p>
          </div>
          <p style="color: #6b7280; font-size: 13px;">${msg.note}</p>
        </div>
        <div style="background: #f3f4f6; padding: 14px; text-align: center; font-size: 12px; color: #9ca3af;">
          © bulebeti Platform — This is an automated message.
        </div>
      </div>
    `;
    sms = msg.smsText;
  }

  // Send to customer
  if (subject && customerEmail) {
    await sendEmail(customerEmail, subject, html, details.restaurantName);
  }
  if (sms && customerPhone && customerPhone !== "N/A") {
    await sendSMS(customerPhone, sms, details.restaurantName);
  }

  // Look up owner (admin) details
  let adminEmail = "admin@bulebeti.com"; // Default fallback
  let adminPhone = "N/A";
  if (details.restaurantId) {
    try {
      const restaurant = await Restaurant.findById(details.restaurantId);
      if (restaurant) {
        const admin = await User.findById(restaurant.ownerId);
        if (admin) {
          adminEmail = admin.email;
          adminPhone = admin.phone || "N/A";
        }
      }
    } catch (err) {
      console.error(
        "Error looking up admin in notifyStatusUpdate:",
        err.message,
      );
    }
  }

  // Send to owner/admin
  if (subject && adminEmail) {
    const adminSubject = `[Admin Alert] Status Updated to ${newStatus}: ${details.guestName || details.name}`;
    const adminHtml = `
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-family: sans-serif; font-size: 13px; color: #1e3a8a;">
        <strong>Notice for Restaurant Owner:</strong> This is a copy of the automated notification sent to the guest regarding their request status update.
      </div>
      ${html}
    `;
    await sendEmail(
      adminEmail,
      adminSubject,
      adminHtml,
      details.restaurantName,
    );
  }

  if (sms && adminPhone && adminPhone !== "N/A") {
    const adminSms = `[${details.restaurantName}] Admin Alert: Request for ${details.guestName || details.name} updated to ${newStatus}.`;
    await sendSMS(adminPhone, adminSms, details.restaurantName);
  }
};

module.exports = {
  sendEmail,
  sendSMS,
  notifyAdminAndCustomer,
  notifyStatusUpdate,
};
