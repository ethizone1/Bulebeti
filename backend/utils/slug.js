// Restaurant slugs become top-level URLs (/:restaurantName), so they must be
// URL-safe and must not collide with the site's own pages.

const RESERVED_SLUGS = new Set([
  "admin", "api", "activate", "bulebeti", "contact-us", "default", "events",
  "forgot-password", "gallery", "health", "healthz", "login", "maedbet",
  "privacy", "profile", "register", "sign-in", "signin", "sister-restaurants",
  "super-admin", "terms", "testimonials",
]);

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const isReservedSlug = (slug) => RESERVED_SLUGS.has(slug);

// Returns a free, non-reserved slug derived from `value`
const uniqueSlug = async (Restaurant, value, fallback = "restaurant") => {
  const base = slugify(value) || fallback;
  let candidate = isReservedSlug(base) ? `${base}-restaurant` : base;
  for (let attempt = 0; attempt < 10; attempt++) {
    if (!(await Restaurant.findOne({ slug: candidate }))) return candidate;
    candidate = `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return `${base}-${Date.now()}`;
};

module.exports = { RESERVED_SLUGS, slugify, isReservedSlug, uniqueSlug };
