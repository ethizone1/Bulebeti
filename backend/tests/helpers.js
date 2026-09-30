// Test harness: mounts the real routers on an Express app with Mongoose model
// methods replaced by an in-memory fixture store, so tests need no database.

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
process.env.NODE_ENV = "test";
delete process.env.CLERK_SECRET_KEY;
delete process.env.GOOGLE_CLIENT_ID;

const express = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Inquiry = require("../models/Inquiry");
const Event = require("../models/Event");
const Feedback = require("../models/Feedback");
const Reservation = require("../models/Reservation");

const notifications = require("../services/notifications");

// Chainable query result supporting .select/.sort/.populate and await
const query = (value) => {
  const q = {
    select: () => q,
    sort: () => q,
    populate: () => q,
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  };
  return q;
};

const matches = (doc, filter = {}) =>
  Object.entries(filter).every(([key, expected]) => {
    if (key === "$or") return expected.some((f) => matches(doc, f));
    const actual = key.split(".").reduce((v, k) => (v == null ? v : v[k]), doc);
    if (expected && typeof expected === "object" && "$in" in expected) {
      return expected.$in.map(String).includes(String(actual));
    }
    return String(actual) === String(expected);
  });

function createStore() {
  const store = { users: {}, restaurants: {}, events: {}, inquiries: [], saved: [], emails: [] };

  const withSave = (doc) => {
    doc.save = async () => doc;
    doc.id = doc.id || doc._id;
    return doc;
  };

  store.addUser = (u) => (store.users[u._id] = withSave({ status: "active", ...u }));
  store.addRestaurant = (r) =>
    (store.restaurants[r._id] = withSave({ admins: [], subscriptionTier: "Basic", ...r }));
  store.addEvent = (e) => (store.events[e._id] = withSave({ ...e }));

  User.findById = (id) => query(store.users[id] || null);
  User.findOne = (f) => query(Object.values(store.users).find((u) => matches(u, f)) || null);
  User.find = (f) => query(Object.values(store.users).filter((u) => matches(u, f)));

  Restaurant.findById = (id) => query(store.restaurants[id] || null);
  Restaurant.findOne = (f) =>
    query(Object.values(store.restaurants).find((r) => matches(r, f)) || null);
  Restaurant.find = (f) => query(Object.values(store.restaurants).filter((r) => matches(r, f)));

  Event.findById = async (id) => store.events[id] || null;
  Event.findByIdAndUpdate = async (id, update) => {
    Object.assign(store.events[id], update.$set);
    return store.events[id];
  };
  Event.findByIdAndDelete = async (id) => delete store.events[id];

  Inquiry.find = (f) => {
    store.inquiryFilters.push(f || {});
    return query(store.inquiries.filter((i) => matches(i, f)));
  };
  store.inquiryFilters = [];

  for (const Model of [Event, Inquiry, Feedback, Reservation, Restaurant, User]) {
    Model.prototype.save = async function () {
      store.saved.push({ model: Model.modelName, doc: this.toObject() });
      return this;
    };
  }

  notifications.notifyAdminAndCustomer = async () => {};
  notifications.sendEmail = async (to) => {
    store.emails.push(to);
    return true;
  };
  notifications.sendSMS = async () => true;

  return store;
}

function createApp() {
  // Require routers after models are stubbed so they bind to the patched statics
  const app = express();
  app.use(express.json());
  app.use("/api/auth", require("../routes/auth"));
  app.use("/api/restaurants", require("../routes/team"));
  app.use("/api/restaurants", require("../routes/restaurants"));
  app.use("/api/inquiries", require("../routes/inquiries"));
  app.use("/api/events", require("../routes/events"));
  app.use("/api/feedback", require("../routes/feedback"));
  app.use("/api/reservations", require("../routes/reservations"));
  return app;
}

async function startServer(app) {
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  const call = async (method, url, { body, userId, token } = {}) => {
    const headers = { "Content-Type": "application/json" };
    const authToken = token || (userId && jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET));
    if (authToken) headers["x-auth-token"] = authToken;
    const res = await fetch(base + url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  };

  return { call, close: () => new Promise((r) => server.close(r)) };
}

module.exports = { createStore, createApp, startServer };
