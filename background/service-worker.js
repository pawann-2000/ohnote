import { PLATFORMS, DEFAULT_ENABLED } from "../lib/platforms.js";
import { parseNotebookUrl } from "../lib/parser.js";
import { SHORTENERS, isShortener } from "../lib/shorteners.js";

const PARENT_ID = "ohnote-parent";
const MANUAL_PARENT_ID = "ohnote-manual-parent";

const DIRECT_PATTERNS = [
  "*://colab.research.google.com/github/*",
  "*://colab.research.google.com/drive/*",
  "*://colab.research.google.com/gist/*",
  "*://github.com/*/blob/*.ipynb",
  "*://github.com/*/blob/*.ipynb?*",
  "*://raw.githubusercontent.com/*.ipynb",
  "*://raw.githubusercontent.com/*.ipynb?*",
  "*://gist.github.com/*",
  "*://nbviewer.org/github/*",
  "*://nbviewer.org/gist/*",
  "*://nbviewer.jupyter.org/github/*",
  "*://nbviewer.jupyter.org/gist/*",
];

const SHORT_PATTERNS = [...SHORTENERS].map((h) => `*://${h}/*`);
const TARGET_PATTERNS = [...DIRECT_PATTERNS, ...SHORT_PATTERNS];

// ---------- Menu setup ----------

async function getEnabledIds() {
  const { enabledPlatforms } = await chrome.storage.sync.get("enabledPlatforms");
  return new Set(enabledPlatforms ?? DEFAULT_ENABLED);
}

async function rebuildMenus() {
  await chrome.contextMenus.removeAll();
  const enabled = await getEnabledIds();
  const direct = PLATFORMS.filter((p) => p.group === "direct" && enabled.has(p.id));
  const manual = PLATFORMS.filter((p) => p.group === "manual" && enabled.has(p.id));

  chrome.contextMenus.create({
    id: PARENT_ID,
    title: "Open notebook in…",
    contexts: ["link"],
    targetUrlPatterns: TARGET_PATTERNS,
  });

  for (const p of direct) {
    chrome.contextMenus.create({
      id: `ohnote:${p.id}`,
      parentId: PARENT_ID,
      title: p.title,
      contexts: ["link"],
      targetUrlPatterns: TARGET_PATTERNS,
    });
  }

  if (manual.length) {
    chrome.contextMenus.create({
      id: "ohnote-sep",
      parentId: PARENT_ID,
      type: "separator",
      contexts: ["link"],
      targetUrlPatterns: TARGET_PATTERNS,
    });
    chrome.contextMenus.create({
      id: MANUAL_PARENT_ID,
      parentId: PARENT_ID,
      title: "Manual import…",
      contexts: ["link"],
      targetUrlPatterns: TARGET_PATTERNS,
    });
    for (const p of manual) {
      chrome.contextMenus.create({
        id: `ohnote:${p.id}`,
        parentId: MANUAL_PARENT_ID,
        title: p.title,
        contexts: ["link"],
        targetUrlPatterns: TARGET_PATTERNS,
      });
    }
  }
  console.debug("[OhNote] menus rebuilt", { direct: direct.length, manual: manual.length });
}

chrome.runtime.onInstalled.addListener(rebuildMenus);
chrome.runtime.onStartup.addListener(rebuildMenus);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.enabledPlatforms) rebuildMenus();
});

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

// ---------- Target planning ----------

function planTarget(platform, parsed, sourceUrl, opts = {}) {
  const built = platform.build(parsed, sourceUrl);

  if (!built) {
    const params = new URLSearchParams({ platform: platform.title, url: sourceUrl });
    if (opts.original && opts.original !== sourceUrl) params.set("original", opts.original);
    if (opts.resolveError) params.set("resolveError", opts.resolveError);
    return { url: chrome.runtime.getURL("pages/unsupported.html") + "?" + params };
  }

  if (platform.group === "manual") {
    const params = new URLSearchParams({ platform: platform.title, url: sourceUrl, open: built });
    return { url: chrome.runtime.getURL("pages/manual.html") + "?" + params };
  }

  return { url: built };
}

// ---------- Click routing ----------

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (typeof info.menuItemId !== "string" || !info.menuItemId.startsWith("ohnote:")) return;
  const platform = PLATFORMS.find((p) => p.id === info.menuItemId.slice("ohnote:".length));
  if (!platform) return;

  const initial = info.linkUrl ?? info.pageUrl;
  const newIndex = (tab?.index ?? -1) + 1;

  if (!isShortener(initial)) {
    const parsed = parseNotebookUrl(initial);
    const plan = planTarget(platform, parsed, initial);
    chrome.tabs.create({ url: plan.url, index: newIndex });
    return;
  }

  // Shortener: open the tab DIRECTLY to the shortener URL and let Chrome
  // follow the redirect natively. Listen for the resulting URL change and
  // re-navigate the same tab to the platform URL. No fetch, no host
  // permission gymnastics — relies only on the `tabs` permission to read
  // the post-redirect URL.
  console.debug("[OhNote] click shortener:", initial, "→", platform.id);
  const newTab = await chrome.tabs.create({ url: initial, index: newIndex });
  const ourTabId = newTab.id;
  let handled = false;

  const cleanup = () => {
    chrome.tabs.onUpdated.removeListener(onUpdate);
    chrome.tabs.onRemoved.removeListener(onRemove);
  };

  const onUpdate = (tabId, changeInfo, updatedTab) => {
    if (handled || tabId !== ourTabId) return;
    const url = changeInfo.url ?? updatedTab.url;
    if (!url || url === initial || isShortener(url)) return;

    handled = true;
    cleanup();

    const parsed = parseNotebookUrl(url);
    const plan = planTarget(platform, parsed, url, { original: initial });
    console.debug("[OhNote] redirect", initial, "→", url, "→ navigating to", plan.url);
    chrome.tabs.update(ourTabId, { url: plan.url }).catch((e) => {
      console.warn("[OhNote] tabs.update failed:", e?.message);
    });
  };

  const onRemove = (tabId) => {
    if (tabId === ourTabId) {
      handled = true;
      cleanup();
    }
  };

  chrome.tabs.onUpdated.addListener(onUpdate);
  chrome.tabs.onRemoved.addListener(onRemove);

  setTimeout(() => {
    if (!handled) {
      handled = true;
      cleanup();
      console.warn("[OhNote] redirect watcher timed out for", initial);
    }
  }, 20000);
});
