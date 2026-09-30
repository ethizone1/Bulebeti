// Shared input validation and output-escaping helpers for public endpoints.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s\-().]{7,20}$/;
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

const isEmail = (v) => typeof v === "string" && v.length <= 254 && EMAIL_RE.test(v.trim());
const isPhone = (v) => typeof v === "string" && PHONE_RE.test(v.trim());
const isObjectId = (v) => typeof v === "string" && OBJECT_ID_RE.test(v);

// Only http(s) links (or inline images/videos) may be stored for rendering in the UI;
// this blocks javascript: and other script-capable URLs.
const isSafeUrl = (v) => {
  if (typeof v !== "string" || v.length > 5_000_000) return false;
  if (/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(v)) return true;
  if (/^data:video\/(mp4|webm|ogg|quicktime);base64,/i.test(v)) return true;
  try {
    const url = new URL(v);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

// Trim strings and cap their length; returns "" for non-strings.
const cleanStr = (v, max = 500) =>
  typeof v === "string" ? v.trim().slice(0, max) : typeof v === "number" ? String(v) : "";

const escapeHtml = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Returns a copy of an object with every string value HTML-escaped (one level deep).
const escapeValues = (obj) =>
  Object.fromEntries(
    Object.entries(obj || {}).map(([k, v]) => [k, typeof v === "string" ? escapeHtml(v) : v]),
  );

module.exports = {
  isEmail,
  isPhone,
  isObjectId,
  isSafeUrl,
  cleanStr,
  escapeHtml,
  escapeValues,
};
