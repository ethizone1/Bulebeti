const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { createStore, createApp, startServer } = require("./helpers");

const store = createStore();
const ID = {"u_super": "aaaaaaaaaaaaaaaaaaaaaaa1", "u_owner": "aaaaaaaaaaaaaaaaaaaaaaa2", "u_team": "aaaaaaaaaaaaaaaaaaaaaaa3", "u_susp": "aaaaaaaaaaaaaaaaaaaaaaa4", "u_verified": "aaaaaaaaaaaaaaaaaaaaaaa5", "u_pending": "aaaaaaaaaaaaaaaaaaaaaaa6", "r_basic": "bbbbbbbbbbbbbbbbbbbbbbb1", "r_other": "bbbbbbbbbbbbbbbbbbbbbbb2", "r_premium": "bbbbbbbbbbbbbbbbbbbbbbb3", "e_premium": "ccccccccccccccccccccccc1"};
const { canManageRestaurant, restaurantHasTier } = require("../middleware/ownership");

let call;
let close;

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

before(async () => {
  store.addUser({ _id: ID.u_super, role: "super-admin", email: "boss@example.com", clerkUserId: "user_boss" });
  store.addUser({ _id: ID.u_owner, role: "admin", email: "owner@example.com" });
  store.addUser({ _id: ID.u_team, role: "sub-admin", email: "team@example.com" });
  store.addUser({ _id: ID.u_susp, role: "admin", status: "suspended", email: "susp@example.com" });
  store.addUser({
    _id: ID.u_verified,
    role: "customer",
    email: "verified@example.com",
    isVerified: true,
    verificationCode: "424242",
    verificationCodeExpires: new Date(Date.now() + 60_000),
  });
  store.addUser({
    _id: ID.u_pending,
    role: "customer",
    status: "pending",
    email: "pending@example.com",
    isVerified: false,
    verificationCode: "135790",
    verificationCodeExpires: new Date(Date.now() + 60_000),
  });

  store.addRestaurant({ _id: ID.r_basic, slug: "basic-place", ownerId: ID.u_owner, subscriptionTier: "Basic" });
  store.addRestaurant({
    _id: ID.r_other,
    slug: "other-place",
    ownerId: "someone-else",
    subscriptionTier: "Premium",
    admins: [{ user: ID.u_team, permissions: [] }],
  });
  store.addRestaurant({ _id: ID.r_premium, slug: "premium-place", ownerId: ID.u_owner, subscriptionTier: "Premium" });
  store.addEvent({ _id: ID.e_premium, restaurantId: ID.r_premium, title: "Gala" });

  ({ call, close } = await startServer(createApp()));
});

after(() => close());

// ── Authentication ──────────────────────────────────────────────────────────

test("unsigned forged token is rejected", async () => {
  const forged = `${b64({ alg: "none", typ: "JWT" })}.${b64({ sub: "user_boss", email: "boss@example.com" })}.`;
  const r = await call("GET", "/api/auth/me", { token: forged });
  assert.equal(r.status, 401);
});

test("token signed with the wrong secret is rejected", async () => {
  const jwt = require("jsonwebtoken");
  const bad = jwt.sign({ user: { id: ID.u_super } }, "not-the-secret");
  const r = await call("GET", "/api/auth/me", { token: bad });
  assert.equal(r.status, 401);
});

test("suspended accounts are blocked", async () => {
  const r = await call("GET", "/api/auth/me", { userId: ID.u_susp });
  assert.equal(r.status, 403);
});

test("removed legacy login routes are gone", async () => {
  for (const path of ["/login", "/google", "/send-login-otp", "/verify-login-otp", "/change-password-preauth", "/seed"]) {
    const r = await call("POST", `/api/auth${path}`, { body: { email: "boss@example.com", code: "123456" } });
    assert.equal(r.status, 404, path);
  }
});

test("verify-email never issues a token without the right code", async () => {
  const verified = await call("POST", "/api/auth/verify-email", { body: { email: "verified@example.com", code: "000000" } });
  assert.equal(verified.status, 400);
  assert.equal(verified.body.token, undefined);

  const master = await call("POST", "/api/auth/verify-email", { body: { email: "pending@example.com", code: "123456" } });
  assert.equal(master.status, 400);
  assert.equal(master.body.token, undefined);
});

test("verification code is invalidated after repeated wrong guesses", async () => {
  for (let i = 0; i < 5; i++) {
    await call("POST", "/api/auth/verify-email", { body: { email: "pending@example.com", code: "000001" } });
  }
  const r = await call("POST", "/api/auth/verify-email", { body: { email: "pending@example.com", code: "135790" } });
  assert.equal(r.status, 400);
  assert.equal(r.body.token, undefined);
});

test("email diagnostics are super-admin only", async () => {
  assert.equal((await call("GET", "/api/auth/test-email-status?email=x@example.com")).status, 401);
  assert.equal((await call("GET", "/api/auth/test-email-status?email=x@example.com", { userId: ID.u_owner })).status, 403);
});

// ── Roles and tenancy ───────────────────────────────────────────────────────

test("restaurant admin cannot change plans or edit other restaurants", async () => {
  const upgrade = await call("PUT", `/api/restaurants/admin/upgrade/${ID.r_basic}`, {
    userId: ID.u_owner,
    body: { action: "approve", subscriptionTier: "Premium" },
  });
  assert.equal(upgrade.status, 403);
  assert.equal(store.restaurants[ID.r_basic].subscriptionTier, "Basic");

  const edit = await call("PUT", `/api/restaurants/admin/edit/${ID.r_other}`, { userId: ID.u_owner, body: { name: "x" } });
  assert.equal(edit.status, 403);
});

test("owner cannot set their own plan through the profile update", async () => {
  const r = await call("PUT", "/api/restaurants/basic-place", {
    userId: ID.u_owner,
    body: { subscriptionTier: "Premium", description: "updated" },
  });
  assert.equal(r.status, 200);
  assert.equal(store.restaurants[ID.r_basic].subscriptionTier, "Basic");
});

test("restaurant admins only query inquiries for their own restaurants", async () => {
  store.inquiryFilters.length = 0;
  const r = await call("GET", "/api/inquiries", { userId: ID.u_owner });
  assert.equal(r.status, 200);
  assert.ok(store.inquiryFilters.every((f) => f.restaurantId), "no unfiltered inquiry query");
});

test("team members (sub-admin) are scoped to their restaurant", async () => {
  assert.equal(await canManageRestaurant(ID.u_team, "sub-admin", ID.r_other), true);
  assert.equal(await canManageRestaurant(ID.u_team, "sub-admin", ID.r_basic), false);
  assert.equal(await canManageRestaurant("x", "super-admin", ID.r_basic), true);
});

// ── Plans ───────────────────────────────────────────────────────────────────

test("plan checks", async () => {
  assert.equal(await restaurantHasTier(ID.r_premium, "Gold", "admin"), true);
  assert.equal(await restaurantHasTier(ID.r_basic, "Gold", "admin"), false);
  assert.equal(await restaurantHasTier(ID.r_basic, "Premium", "super-admin"), true);
});

test("Basic plan cannot create events", async () => {
  const r = await call("POST", "/api/events", { userId: ID.u_owner, body: { restaurantId: ID.r_basic, title: "x" } });
  assert.equal(r.status, 403);
  assert.match(r.body.msg, /Premium/);
});

test("an event cannot be moved to another restaurant", async () => {
  const r = await call("PUT", `/api/events/${ID.e_premium}`, {
    userId: ID.u_owner,
    body: { title: "Renamed", restaurantId: ID.r_other },
  });
  assert.equal(r.status, 200);
  assert.equal(store.events[ID.e_premium].restaurantId, ID.r_premium);
  assert.equal(store.events[ID.e_premium].title, "Renamed");
});

test("new restaurants start on Basic and record the requested plan as pending", async () => {
  store.saved.length = 0;
  const r = await call("POST", "/api/restaurants", {
    userId: ID.u_team,
    body: { name: "New Spot", slug: "new-spot", subscriptionTier: "Premium" },
  });
  assert.equal(r.status, 200);
  const saved = store.saved.find((s) => s.model === "Restaurant").doc;
  assert.equal(saved.subscriptionTier, "Basic");
  assert.equal(saved.pendingTierRequest, "Premium");
});

// ── Public forms ────────────────────────────────────────────────────────────

test("reservation requires valid details and an existing restaurant", async () => {
  const bad = await call("POST", "/api/reservations", {
    body: { restaurantId: ID.r_basic, guestName: "A", email: "not-an-email", date: "2026-10-01", time: "19:00", guests: 2 },
  });
  assert.equal(bad.status, 400);

  const missing = await call("POST", "/api/reservations", {
    body: { restaurantId: "no-such-place", guestName: "A", email: "a@example.com", date: "2026-10-01", time: "19:00", guests: 2 },
  });
  assert.equal(missing.status, 404);
});

test("reservation accepts a restaurant slug", async () => {
  store.saved.length = 0;
  const r = await call("POST", "/api/reservations", {
    body: { restaurantId: "basic-place", guestName: "Abebe", email: "a@example.com", phone: "N/A", date: "2026-10-01", time: "19:00", guests: 2 },
  });
  assert.equal(r.status, 200);
  const saved = store.saved.find((s) => s.model === "Reservation").doc;
  assert.equal(String(saved.restaurantId), ID.r_basic);
});

test("public feedback cannot set its own status", async () => {
  store.saved.length = 0;
  const r = await call("POST", "/api/feedback", {
    body: {
      restaurantId: ID.r_basic,
      customer: "Guest",
      phone: "+251 911 000000",
      rating: 5,
      comment: "Great",
      status: "Published",
    },
  });
  assert.equal(r.status, 200);
  const saved = store.saved.find((s) => s.model === "Feedback").doc;
  assert.equal(saved.status, "New");
});

test("public feedback rejects an unknown restaurant", async () => {
  const r = await call("POST", "/api/feedback", {
    body: { restaurantId: "f".repeat(24), customer: "Guest", phone: "+251911000000", rating: 5, comment: "Hi" },
  });
  assert.equal(r.status, 404);
});
