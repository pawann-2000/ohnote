import { PLATFORMS, DEFAULT_ENABLED } from "../lib/platforms.js";
import { parseNotebookUrl } from "../lib/parser.js";

const urlEl = document.getElementById("url");
const pasteBtn = document.getElementById("paste");
const statusEl = document.getElementById("status");
const leadEl = document.getElementById("lead");
const optionsLink = document.getElementById("optionsLink");

const groups = {
  direct: { section: document.getElementById("directGroup"), list: document.getElementById("directList") },
  manual: { section: document.getElementById("manualGroup"), list: document.getElementById("manualList") },
  unavailable: { section: document.getElementById("unavailableGroup"), list: document.getElementById("unavailableList") },
};

let enabled = new Set(DEFAULT_ENABLED);

async function loadEnabled() {
  const { enabledPlatforms } = await chrome.storage.sync.get("enabledPlatforms");
  enabled = new Set(enabledPlatforms ?? DEFAULT_ENABLED);
}

function setStatus(text, ttl = 1800) {
  statusEl.textContent = text;
  if (ttl) setTimeout(() => { if (statusEl.textContent === text) statusEl.textContent = ""; }, ttl);
}

function planTarget(platform, parsed, sourceUrl) {
  const built = platform.build(parsed, sourceUrl);
  if (!built) return null;
  if (platform.group === "manual") {
    const params = new URLSearchParams({ platform: platform.title, url: sourceUrl, open: built });
    return chrome.runtime.getURL("pages/manual.html") + "?" + params;
  }
  return built;
}

function makeRow(platform, target) {
  const li = document.createElement("li");
  li.className = "platform-row";

  const label = document.createElement("span");
  label.className = "platform-name";
  label.textContent = platform.title;

  li.appendChild(label);

  if (target) {
    const btn = document.createElement("a");
    btn.className = "primary";
    btn.textContent = platform.group === "manual" ? "Copy & open" : "Open";
    btn.href = target;
    btn.target = "_blank";
    btn.rel = "noopener noreferrer";
    li.appendChild(btn);
  } else {
    const note = document.createElement("span");
    note.className = "muted";
    note.textContent = "Not compatible";
    li.appendChild(note);
  }
  return li;
}

function render() {
  for (const g of Object.values(groups)) {
    g.list.innerHTML = "";
    g.section.hidden = true;
  }

  const raw = urlEl.value.trim();
  if (!raw) {
    leadEl.textContent = "Paste a notebook URL, then pick a platform.";
    return;
  }

  const parsed = parseNotebookUrl(raw);
  if (!parsed) {
    leadEl.textContent = "Couldn't recognise this URL as a notebook. Pick a platform anyway — some accept arbitrary URLs.";
  } else {
    leadEl.textContent = "Pick where to open this notebook.";
  }

  for (const p of PLATFORMS) {
    if (!enabled.has(p.id)) continue;
    const target = planTarget(p, parsed, raw);
    const row = makeRow(p, target);
    const bucket = target ? (p.group === "manual" ? groups.manual : groups.direct) : groups.unavailable;
    bucket.list.appendChild(row);
  }

  for (const g of Object.values(groups)) {
    g.section.hidden = g.list.childElementCount === 0;
  }
}

urlEl.addEventListener("input", render);

pasteBtn.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      urlEl.value = text.trim();
      render();
      setStatus("Pasted.");
    }
  } catch {
    setStatus("Clipboard read blocked — paste manually with Cmd/Ctrl+V.");
  }
});

optionsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.enabledPlatforms) {
    enabled = new Set(changes.enabledPlatforms.newValue ?? DEFAULT_ENABLED);
    render();
  }
});

(async () => {
  await loadEnabled();
  const params = new URLSearchParams(location.search);
  const seeded = params.get("url");
  if (seeded) urlEl.value = seeded;
  render();
  if (!seeded) urlEl.focus();
})();
