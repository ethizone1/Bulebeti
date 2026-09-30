const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { createStore, createApp, startServer } = require("./helpers");

const store = createStore();
const ID = {
  owner: "d".repeat(23) + "1",
  member: "d".repeat(23) + "2",
  basic: "e".repeat(23) + "1",
  gold: "e".repeat(23) + "2",
};

let call;
let close;

before(async () => {
  store.addUser({ _id: ID.owner, role: "admin", email: "owner@example.com" });
  store.addUser({ _id: ID.member, role: "sub-admin", email: "member@example.com" });
  // Basic allows one team member, and this one is already full
  store.addRestaurant({
    _id: ID.basic,
    slug: "full-basic",
    ownerId: ID.owner,
    subscriptionTier: "Basic",
    admins: [{ user: ID.member, permissions: [] }],
  });
  store.addRestaurant({ _id: ID.gold, slug: "gold-spot", ownerId: ID.owner, subscriptionTier: "Gold" });
  ({ call, close } = await startServer(createApp()));
});

after(() => close());

test("a full team rejects the invite without creating an account or emailing", async () => {
  store.saved.length = 0;
  store.emails.length = 0;
  const r = await call("POST", "/api/restaurants/full-basic/team", {
    userId: ID.owner,
    body: { email: "new@example.com", phone: "+251911000000" },
  });
  assert.equal(r.status, 403);
  assert.equal(store.saved.filter((s) => s.model === "User").length, 0);
  assert.deepEqual(store.emails, []);
});

test("inviting an existing member is rejected without emailing", async () => {
  store.emails.length = 0;
  const r = await call("POST", "/api/restaurants/full-basic/team", {
    userId: ID.owner,
    body: { email: "member@example.com" },
  });
  assert.equal(r.status, 400);
  assert.deepEqual(store.emails, []);
});

test("new team members get a password-less account and a sign-in email", async () => {
  store.saved.length = 0;
  store.emails.length = 0;
  const r = await call("POST", "/api/restaurants/gold-spot/team", {
    userId: ID.owner,
    body: { email: "New.Member@Example.com" },
  });
  assert.equal(r.status, 200);
  const created = store.saved.find((s) => s.model === "User").doc;
  assert.equal(created.email, "new.member@example.com");
  assert.equal(created.role, "sub-admin");
  assert.equal(created.password, undefined);
  assert.deepEqual(store.emails, ["new.member@example.com"]);
});

test("invites require a valid email", async () => {
  const r = await call("POST", "/api/restaurants/gold-spot/team", { userId: ID.owner, body: { email: "nope" } });
  assert.equal(r.status, 400);
});
