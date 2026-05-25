const params = new URLSearchParams(location.search);
document.getElementById("platform").textContent = params.get("platform") || "The chosen platform";

const urlEl = document.getElementById("url");
urlEl.value = params.get("url") || "";

const original = params.get("original");
if (original) {
  document.getElementById("originalField").hidden = false;
  document.getElementById("original").value = original;
}

const resolveError = params.get("resolveError");
if (resolveError) {
  document.getElementById("title").textContent = "Couldn't follow the short link";
  document.getElementById("lead").hidden = true;
  document.getElementById("urlLabel").textContent = "Short URL we couldn't resolve";
  const alertEl = document.getElementById("resolveAlert");
  alertEl.hidden = false;
  document.getElementById("resolveDetail").textContent = resolveError;
}

const statusEl = document.getElementById("status");
document.getElementById("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(urlEl.value);
    statusEl.textContent = "Copied.";
  } catch {
    urlEl.select();
    document.execCommand("copy");
    statusEl.textContent = "Copied.";
  }
  setTimeout(() => { statusEl.textContent = ""; }, 1500);
});
