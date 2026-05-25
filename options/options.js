import { PLATFORMS, DEFAULT_ENABLED } from "../lib/platforms.js";

const directEl = document.getElementById("direct");
const manualEl = document.getElementById("manual");
const statusEl = document.getElementById("status");
const versionEl = document.getElementById("version");

function render(enabled) {
  directEl.innerHTML = "";
  manualEl.innerHTML = "";

  for (const p of PLATFORMS) {
    const li = document.createElement("li");
    const id = `cb-${p.id}`;

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = id;
    input.dataset.platform = p.id;
    input.checked = enabled.has(p.id);

    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = p.title;

    li.append(input, label);
    (p.group === "manual" ? manualEl : directEl).appendChild(li);
  }
}

async function load() {
  const { enabledPlatforms } = await chrome.storage.sync.get("enabledPlatforms");
  return new Set(enabledPlatforms ?? DEFAULT_ENABLED);
}

let saveTimer;
async function save() {
  const checked = [...document.querySelectorAll('input[data-platform]')]
    .filter((el) => el.checked)
    .map((el) => el.dataset.platform);
  await chrome.storage.sync.set({ enabledPlatforms: checked });
  statusEl.textContent = "Saved.";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { statusEl.textContent = ""; }, 1200);
}

(async () => {
  render(await load());
  if (versionEl && chrome.runtime?.getManifest) {
    versionEl.textContent = chrome.runtime.getManifest().version;
  }
  document.addEventListener("change", (e) => {
    if (e.target.matches("input[data-platform]")) save();
  });
})();
