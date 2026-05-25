import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { PLATFORMS, DEFAULT_ENABLED } from "../lib/platforms.js";
import { parseNotebookUrl } from "../lib/parser.js";

const ghInfo = parseNotebookUrl(
  "https://github.com/foo/bar/blob/main/notebooks/demo.ipynb"
);
const gistInfo = parseNotebookUrl("https://gist.github.com/alice/abc123");
const driveInfo = parseNotebookUrl(
  "https://colab.research.google.com/drive/DRIVE_ID"
);

function find(id) {
  return PLATFORMS.find((p) => p.id === id);
}

describe("PLATFORMS — direct builders", () => {
  test("Colab builds github launch URL", () => {
    assert.equal(
      find("colab").build(ghInfo, ""),
      "https://colab.research.google.com/github/foo/bar/blob/main/notebooks/demo.ipynb"
    );
  });

  test("Colab builds gist URL", () => {
    assert.equal(
      find("colab").build(gistInfo, ""),
      "https://colab.research.google.com/gist/alice/abc123"
    );
  });

  test("Colab builds drive URL", () => {
    assert.equal(
      find("colab").build(driveInfo, ""),
      "https://colab.research.google.com/drive/DRIVE_ID"
    );
  });

  test("Kaggle uses GitHub blob target", () => {
    const url = find("kaggle").build(ghInfo, "");
    assert.match(url, /^https:\/\/www\.kaggle\.com\/kernels\/welcome\?src=/);
    assert.match(decodeURIComponent(url), /github\.com\/foo\/bar/);
  });

  test("Deepnote builds launch URL", () => {
    const url = find("deepnote").build(ghInfo, "");
    assert.match(url, /^https:\/\/deepnote\.com\/launch\?url=/);
  });

  test("SageMaker only builds for github source", () => {
    assert.ok(find("sagemaker").build(ghInfo, ""));
    assert.equal(find("sagemaker").build(driveInfo, ""), null);
  });

  test("Binder github builds v2/gh URL", () => {
    const url = find("binder").build(ghInfo, "");
    assert.match(
      url,
      /^https:\/\/mybinder\.org\/v2\/gh\/foo\/bar\/main\?filepath=notebooks%2Fdemo\.ipynb$/
    );
  });

  test("Binder gist builds v2/gist URL", () => {
    assert.equal(
      find("binder").build(gistInfo, ""),
      "https://mybinder.org/v2/gist/alice/abc123/HEAD"
    );
  });

  test("nbviewer builds github URL", () => {
    assert.equal(
      find("nbviewer").build(ghInfo, ""),
      "https://nbviewer.org/github/foo/bar/blob/main/notebooks/demo.ipynb"
    );
  });

  test("github.dev builds editor URL", () => {
    assert.equal(
      find("githubdev").build(ghInfo, ""),
      "https://github.dev/foo/bar/blob/main/notebooks/demo.ipynb"
    );
  });

  test("vscode.dev builds editor URL", () => {
    assert.equal(
      find("vscodedev").build(ghInfo, ""),
      "https://vscode.dev/github/foo/bar/blob/main/notebooks/demo.ipynb"
    );
  });

  test("raw download builds raw URL", () => {
    assert.equal(
      find("githubraw").build(ghInfo, ""),
      "https://raw.githubusercontent.com/foo/bar/main/notebooks/demo.ipynb"
    );
  });
});

describe("PLATFORMS — manual builders", () => {
  for (const id of ["lightning", "paperspace", "runpod", "saturn", "modal"]) {
    test(`${id} returns a usable https URL`, () => {
      const url = find(id).build(null, "");
      assert.match(url, /^https:\/\//);
    });
  }
});

describe("DEFAULT_ENABLED", () => {
  test("contains every platform by id", () => {
    assert.equal(DEFAULT_ENABLED.length, PLATFORMS.length);
    for (const p of PLATFORMS) {
      assert.ok(DEFAULT_ENABLED.includes(p.id), `${p.id} should be enabled by default`);
    }
  });

  test("every platform is direct or manual", () => {
    for (const p of PLATFORMS) {
      assert.ok(p.group === "direct" || p.group === "manual", `${p.id}: ${p.group}`);
    }
  });
});
