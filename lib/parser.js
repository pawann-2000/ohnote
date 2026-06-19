// Parse a notebook URL into a normalized descriptor.
// Recognizes Colab (github / drive / gist), GitHub blob links, raw.githubusercontent.com,
// and gist.github.com.

export function parseNotebookUrl(url) {
  if (!url) return null;
  let u;
  try { u = new URL(url); } catch { return null; }

  if (u.hostname === "colab.research.google.com") {
    let m = u.pathname.match(/^\/github\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
    if (m) return { source: "github", user: m[1], repo: m[2], branch: m[3], path: decodeURIComponent(m[4]) };

    m = u.pathname.match(/^\/github\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/?(.*)$/);
    if (m) return { source: "github-tree", user: m[1], repo: m[2], branch: m[3], path: decodeURIComponent(m[4] || "") };

    m = u.pathname.match(/^\/drive\/([^/?#]+)/);
    if (m) return { source: "drive", fileId: m[1] };

    m = u.pathname.match(/^\/gist\/([^/]+)\/([^/?#]+)/);
    if (m) return { source: "gist", user: m[1], gistId: m[2] };

    return { source: "colab-other", url };
  }

  if (u.hostname === "github.com") {
    const m = u.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
    if (m && /\.ipynb($|[?#])/.test(m[4])) {
      return { source: "github", user: m[1], repo: m[2], branch: m[3], path: decodeURIComponent(m[4].replace(/[?#].*$/, "")) };
    }
  }

  if (u.hostname === "raw.githubusercontent.com") {
    const m = u.pathname.match(/^\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/);
    if (m && /\.ipynb($|[?#])/.test(m[4])) {
      return { source: "github", user: m[1], repo: m[2], branch: m[3], path: decodeURIComponent(m[4].replace(/[?#].*$/, "")) };
    }
  }

  if (u.hostname === "gist.github.com") {
    const m = u.pathname.match(/^\/([^/]+)\/([^/?#]+)/);
    if (m) return { source: "gist", user: m[1], gistId: m[2] };
  }

  if (u.hostname === "nbviewer.org" || u.hostname === "nbviewer.jupyter.org") {
    const m = u.pathname.match(/^\/github\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
    if (m) return { source: "github", user: m[1], repo: m[2], branch: m[3], path: decodeURIComponent(m[4]) };
  }

  if (u.hostname === "huggingface.co") {
    // Models live at /USER/REPO, datasets at /datasets/USER/REPO, spaces at
    // /spaces/USER/REPO. File views use /blob/, /resolve/, or /raw/.
    let rest = u.pathname;
    let repoType = "model";
    if (rest.startsWith("/datasets/")) { repoType = "dataset"; rest = rest.slice("/datasets".length); }
    else if (rest.startsWith("/spaces/")) { repoType = "space"; rest = rest.slice("/spaces".length); }

    const m = rest.match(/^\/([^/]+)\/([^/]+)\/(?:blob|resolve|raw)\/([^/]+)\/(.+)$/);
    if (m && /\.ipynb($|[?#])/.test(m[4])) {
      return {
        source: "huggingface",
        repoType,
        user: m[1],
        repo: m[2],
        branch: m[3],
        path: decodeURIComponent(m[4].replace(/[?#].*$/, "")),
      };
    }
  }

  return null;
}

// Hugging Face repo path prefix by repo type. Models have no prefix.
function hfPrefix(repoType) {
  if (repoType === "dataset") return "datasets/";
  if (repoType === "space") return "spaces/";
  return "";
}

// Encode each `/`-separated segment but preserve slashes — encodeURIComponent
// alone would escape the slashes too.
export function encodePath(p) {
  return p.split("/").map(encodeURIComponent).join("/");
}

export function toGitHubBlobUrl(info) {
  if (info?.source !== "github") return null;
  return `https://github.com/${info.user}/${info.repo}/blob/${info.branch}/${encodePath(info.path)}`;
}

export function toRawGitHubUrl(info) {
  if (info?.source !== "github") return null;
  return `https://raw.githubusercontent.com/${info.user}/${info.repo}/${info.branch}/${encodePath(info.path)}`;
}

// Direct (downloadable) URL for a Hugging Face notebook — the /resolve/ endpoint.
export function toHuggingFaceRawUrl(info) {
  if (info?.source !== "huggingface") return null;
  return `https://huggingface.co/${hfPrefix(info.repoType)}${info.user}/${info.repo}/resolve/${info.branch}/${encodePath(info.path)}`;
}

// Raw notebook URL for any source that has one (GitHub or Hugging Face).
export function toRawUrl(info) {
  return toRawGitHubUrl(info) ?? toHuggingFaceRawUrl(info);
}
