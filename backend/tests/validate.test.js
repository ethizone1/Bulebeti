const { test } = require("node:test");
const assert = require("node:assert/strict");
const { escapeHtml, isSafeUrl, isEmail, isPhone, cleanStr } = require("../utils/validate");

test("escapeHtml neutralizes markup", () => {
  assert.equal(escapeHtml('<a href="x">Tom & Jerry\'s</a>'), "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;");
});

test("isSafeUrl allows only http(s) links and inline images", () => {
  assert.equal(isSafeUrl("https://example.com/a.png"), true);
  assert.equal(isSafeUrl("data:image/png;base64,AAAA"), true);
  assert.equal(isSafeUrl("data:video/mp4;base64,AAAA"), true);
  assert.equal(isSafeUrl("javascript:alert(1)"), false);
  assert.equal(isSafeUrl("data:text/html,<script>"), false);
  assert.equal(isSafeUrl("not a url"), false);
});

test("contact validators", () => {
  assert.equal(isEmail("a@example.com"), true);
  assert.equal(isEmail("nope"), false);
  assert.equal(isPhone("+251 911 000 000"), true);
  assert.equal(isPhone("call me"), false);
});

test("cleanStr trims and caps length", () => {
  assert.equal(cleanStr("  hi  "), "hi");
  assert.equal(cleanStr("x".repeat(10), 3), "xxx");
  assert.equal(cleanStr({ $gt: "" }), "");
});
