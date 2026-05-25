// URL shortener hostnames where OhNote should attempt to follow the redirect
// before deciding whether the link points at a notebook.
//
// The service worker doesn't fetch these URLs. When the user clicks a menu
// entry on a shortener link, the SW opens the URL in a new tab and lets the
// browser follow the redirect natively, then watches `chrome.tabs.onUpdated`
// for the resolved URL. That means no `host_permissions` are required for
// these hosts — only the `tabs` permission, which is already declared.
export const SHORTENERS = new Set([
  "t.co",
  "bit.ly",
  "tinyurl.com",
  "goo.gl",
  "ow.ly",
  "buff.ly",
  "lnkd.in",
  "fb.me",
  "is.gd",
  "tiny.cc",
  "rebrand.ly",
  "trib.al",
  "rb.gy",
  "shorturl.at",
  "cutt.ly",
  "bl.ink",
  "dlvr.it",
  "snip.ly",
]);

export function isShortener(url) {
  try {
    return SHORTENERS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}
