# OhNote — Open notebooks anywhere

A Chrome extension. Right-click any Colab, GitHub `.ipynb`, raw, gist, or
nbviewer link and pick a platform to open the notebook in.

## Supported platforms

**Direct import** (extension builds the launch URL):

- Google Colab
- Kaggle Notebooks
- Deepnote
- Amazon SageMaker Studio Lab
- Binder (mybinder.org)
- nbviewer
- GitHub.dev (browser editor)
- VS Code for the Web (vscode.dev)
- Raw `.ipynb` (download / JSON)

**Manual import** (the platform doesn't accept an import URL — OhNote opens its
"create" page so you can paste the source URL):

- Lightning AI Studio
- Paperspace Gradient
- RunPod
- Saturn Cloud
- Modal

Toggle which platforms appear in the menu from the extension's Options page.

## How it works

- **Direct notebook links** (`*.ipynb` on github / raw, any path on
  Colab/gist/nbviewer): the URL itself proves it's a notebook, so the menu
  shows immediately on right-click.
- **Shortened links** (`t.co`, `bit.ly`, `tinyurl.com`, `goo.gl`, `lnkd.in`,
  …): the menu shows on the shortener URL. When you click a platform, OhNote
  opens the shortener in a new tab, lets the browser follow the redirect
  natively (no extra fetch, no network permissions), and then redirects that
  same tab to the platform's launch URL.

Supported shortener hosts are listed in `lib/shorteners.js` and mirrored in
the context-menu's `targetUrlPatterns` in `background/service-worker.js`.

## Recognized inputs

- `colab.research.google.com/github/USER/REPO/blob/BRANCH/PATH.ipynb`
- `colab.research.google.com/gist/USER/GIST_ID`
- `colab.research.google.com/drive/FILE_ID` (Colab → Colab only)
- `github.com/USER/REPO/blob/BRANCH/PATH.ipynb`
- `raw.githubusercontent.com/USER/REPO/BRANCH/PATH.ipynb`
- `gist.github.com/USER/GIST_ID`
- `nbviewer.org/github/...`

Google Drive Colab notebooks can only be opened back in Colab — Kaggle,
Deepnote, SageMaker, etc. need a public GitHub URL.

## Install (developer mode)

1. Go to `chrome://extensions`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and select this folder.
4. Right-click any notebook link → **Open notebook in…**

## Layout

```
manifest.json
background/service-worker.js   # menu setup + click routing
lib/parser.js                  # URL → { source, user, repo, branch, path }
lib/platforms.js               # platform list + build() per platform
lib/shorteners.js              # known shortener hosts + isShortener()
options/                       # toggle which platforms appear
pages/manual.html|js           # auto-copy URL + open platform create page
pages/unsupported.html|js      # fallback when no import URL can be built
pages/resolving.html|js        # placeholder while redirect follows
icons/                         # 16/48/128 px PNG toolbar icons
test/                          # node --test based suite
```

## Adding a platform

Append an entry to `lib/platforms.js`:

```js
{
  id: "myplatform",
  title: "My Platform",
  group: "direct",                 // or "manual"
  build: (info, sourceUrl) => {
    if (info?.source !== "github") return null;
    return `https://my.platform/import/${info.user}/${info.repo}/${info.branch}/${info.path}`;
  },
}
```

Reload the extension at `chrome://extensions`. Done.

## Develop

```sh
npm test            # node --test (no extra deps required)
npm run package     # build ohnote.zip ready to upload to the Web Store
```

## Permissions

| Permission     | Why                                                          |
| -------------- | ------------------------------------------------------------ |
| `contextMenus` | Add the "Open notebook in…" submenu to the link context menu |
| `storage`      | Remember which platforms the user has enabled                |
| `tabs`         | Read the post-redirect URL when following a shortened link   |

OhNote does **not** request `<all_urls>` host permissions and does not make
any cross-origin `fetch()` calls. Redirects on shortened links are followed
by the browser itself, via the URL bar.

## Privacy

OhNote does not collect, transmit, or persist any browsing data. The only
data stored is your platform-enable preferences, kept in `chrome.storage.sync`
on your own Google account.
