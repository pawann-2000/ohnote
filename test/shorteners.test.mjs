import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { SHORTENERS, isShortener } from "../lib/shorteners.js";

describe("SHORTENERS", () => {
  test("contains expected core hosts", () => {
    for (const host of ["t.co", "bit.ly", "tinyurl.com", "lnkd.in"]) {
      assert.ok(SHORTENERS.has(host), `${host} should be in SHORTENERS`);
    }
  });
});

describe("isShortener", () => {
  test("true for known shortener URLs", () => {
    assert.equal(isShortener("https://t.co/abc123"), true);
    assert.equal(isShortener("http://bit.ly/xyz"), true);
    assert.equal(isShortener("https://tinyurl.com/def456"), true);
  });

  test("false for non-shortener hosts", () => {
    assert.equal(isShortener("https://google.com"), false);
    assert.equal(isShortener("https://github.com/user/repo"), false);
    assert.equal(isShortener("https://example.com/path"), false);
  });

  test("false for malformed URLs", () => {
    assert.equal(isShortener("not-a-url"), false);
    assert.equal(isShortener(""), false);
    assert.equal(isShortener(null), false);
  });
});
