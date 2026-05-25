const params = new URLSearchParams(location.search);
const platform = params.get("platform") || "the platform";
const url = params.get("url") || "";
const open = params.get("open") || "";

document.getElementById("platform").textContent = platform;
const urlEl = document.getElementById("url");
urlEl.value = url;
document.getElementById("open").href = open;

const statusEl = document.getElementById("status");
const copyBtn = document.getElementById("copy");

async function copy({ silent = false } = {}) {
  try {
    await navigator.clipboard.writeText(url);
    statusEl.textContent = "Copied to clipboard — paste it on the platform.";
  } catch {
    try {
      urlEl.focus();
      urlEl.select();
      document.execCommand("copy");
      statusEl.textContent = "Copied — paste it on the platform.";
    } catch {
      if (!silent) statusEl.textContent = "Couldn't auto-copy. Click Copy.";
    }
  }
  if (!silent) setTimeout(() => { statusEl.textContent = ""; }, 2500);
}

copyBtn.addEventListener("click", () => copy());

// Best-effort auto-copy. Browsers vary on whether a context-menu navigation
// counts as user activation in the new tab, so the visible Copy button is the
// real path.
copy({ silent: true });
