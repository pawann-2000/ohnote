# OhNote — Privacy policy

_Last updated: 2026-05-23_

OhNote is a Chrome extension that adds a "Open notebook in…" entry to the
right-click menu when you click on a Jupyter notebook link, so you can open
the same notebook in another platform (Colab, Kaggle, Deepnote, etc.).

## Data collection

**We do not collect, transmit, or sell any personal data.**

OhNote does not include any analytics, telemetry, or tracking code, and it
does not contact any server operated by us. There is no account, no login,
and no remote configuration.

## Data stored locally

The extension uses `chrome.storage.sync` to remember which target platforms
you have enabled in the Options page. This list is synced through your own
Chrome / Google account, never sent to us.

## What the extension reads

- The URL of the link you right-clicked (provided by Chrome via the
  `contextMenus` API). This is read only at the moment of the right-click and
  used solely to build a launch URL for the platform you chose. It is never
  stored or transmitted.
- For shortened links (e.g. `bit.ly`, `t.co`): when you click a platform, the
  shortener URL is opened in a new tab so the browser can follow the redirect
  natively. OhNote then reads the resolved URL of that tab (via the `tabs`
  permission) so it can navigate to the platform's launch URL. The resolved
  URL is not stored.

## Permissions

| Permission     | Why                                                          |
| -------------- | ------------------------------------------------------------ |
| `contextMenus` | Add the "Open notebook in…" submenu to the link context menu |
| `storage`      | Remember which platforms the user has enabled                |
| `tabs`         | Read the post-redirect URL when following a shortened link   |

OhNote does **not** request `<all_urls>` host permissions and does not make
any cross-origin `fetch()` requests.

## Contact

Open an issue on the project's GitHub repository.
