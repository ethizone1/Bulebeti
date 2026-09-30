const { test } = require("node:test");
const assert = require("node:assert/strict");
const { slugify, isReservedSlug, uniqueSlug } = require("../utils/slug");

const fakeRestaurant = (taken) => ({ findOne: async ({ slug }) => (taken.includes(slug) ? { slug } : null) });

test("slugify produces URL-safe slugs", () => {
  assert.equal(slugify("  Café Abyssinia! "), "caf-abyssinia");
  assert.equal(slugify("../../admin"), "admin");
});

test("reserved page names are never used as slugs", async () => {
  assert.equal(isReservedSlug("events"), true);
  assert.equal(await uniqueSlug(fakeRestaurant([]), "Events"), "events-restaurant");
  assert.equal(await uniqueSlug(fakeRestaurant([]), "Super Admin"), "super-admin-restaurant");
});

test("taken slugs get a suffix", async () => {
  const slug = await uniqueSlug(fakeRestaurant(["injera-world"]), "Injera World");
  assert.match(slug, /^injera-world-\d{4}$/);
});
