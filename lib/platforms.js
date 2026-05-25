// Platform definitions. Each entry's `build(info, sourceUrl)` returns either
// a target URL (direct import) or `{ url, mode: "manual", hint }` for platforms
// where we can only land the user on a create page and tell them to paste.

import { toGitHubBlobUrl, toRawGitHubUrl, encodePath } from "./parser.js";

export const PLATFORMS = [
  {
    id: "colab",
    title: "Google Colab",
    group: "direct",
    build: (info) => {
      if (info?.source === "github")
        return `https://colab.research.google.com/github/${info.user}/${info.repo}/blob/${info.branch}/${encodePath(info.path)}`;
      if (info?.source === "gist")
        return `https://colab.research.google.com/gist/${info.user}/${info.gistId}`;
      if (info?.source === "drive")
        return `https://colab.research.google.com/drive/${info.fileId}`;
      return null;
    },
  },
  {
    id: "kaggle",
    title: "Kaggle Notebooks",
    group: "direct",
    build: (info, sourceUrl) => {
      if (!info) return null;
      const target = toGitHubBlobUrl(info) ?? sourceUrl;
      return `https://www.kaggle.com/kernels/welcome?src=${encodeURIComponent(target)}`;
    },
  },
  {
    id: "deepnote",
    title: "Deepnote",
    group: "direct",
    build: (info, sourceUrl) => {
      if (!info) return null;
      const target = toGitHubBlobUrl(info) ?? sourceUrl;
      return `https://deepnote.com/launch?url=${encodeURIComponent(target)}`;
    },
  },
  {
    id: "sagemaker",
    title: "Amazon SageMaker Studio Lab",
    group: "direct",
    build: (info) => {
      if (info?.source !== "github") return null;
      return `https://studiolab.sagemaker.aws/import/github/${info.user}/${info.repo}/blob/${info.branch}/${encodePath(info.path)}`;
    },
  },
  {
    id: "binder",
    title: "Binder (mybinder.org)",
    group: "direct",
    build: (info) => {
      if (info?.source === "github")
        return `https://mybinder.org/v2/gh/${info.user}/${info.repo}/${info.branch}?filepath=${encodeURIComponent(info.path)}`;
      if (info?.source === "gist")
        return `https://mybinder.org/v2/gist/${info.user}/${info.gistId}/HEAD`;
      return null;
    },
  },
  {
    id: "nbviewer",
    title: "nbviewer",
    group: "direct",
    build: (info) => {
      if (info?.source === "github")
        return `https://nbviewer.org/github/${info.user}/${info.repo}/blob/${info.branch}/${encodePath(info.path)}`;
      if (info?.source === "gist")
        return `https://nbviewer.org/gist/${info.user}/${info.gistId}`;
      return null;
    },
  },
  {
    id: "githubdev",
    title: "GitHub.dev (browser editor)",
    group: "direct",
    build: (info) => {
      if (info?.source !== "github") return null;
      return `https://github.dev/${info.user}/${info.repo}/blob/${info.branch}/${encodePath(info.path)}`;
    },
  },
  {
    id: "vscodedev",
    title: "VS Code for the Web (vscode.dev)",
    group: "direct",
    build: (info) => {
      if (info?.source !== "github") return null;
      return `https://vscode.dev/github/${info.user}/${info.repo}/blob/${info.branch}/${encodePath(info.path)}`;
    },
  },
  {
    id: "githubraw",
    title: "Raw .ipynb (download / JSON)",
    group: "direct",
    build: (info) => toRawGitHubUrl(info),
  },
  {
    id: "lightning",
    title: "Lightning AI Studio (manual)",
    group: "manual",
    build: () => "https://lightning.ai/studios",
  },
  {
    id: "paperspace",
    title: "Paperspace Gradient (manual)",
    group: "manual",
    build: () => "https://console.paperspace.com/notebooks/create",
  },
  {
    id: "runpod",
    title: "RunPod (manual)",
    group: "manual",
    build: () => "https://www.runpod.io/console/deploy",
  },
  {
    id: "saturn",
    title: "Saturn Cloud (manual)",
    group: "manual",
    build: () => "https://app.community.saturnenterprise.io/dash/resources",
  },
  {
    id: "modal",
    title: "Modal (manual)",
    group: "manual",
    build: () => "https://modal.com/apps",
  },
];

export const DEFAULT_ENABLED = PLATFORMS.map((p) => p.id);
