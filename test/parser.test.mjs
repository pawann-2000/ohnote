import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseNotebookUrl, toGitHubBlobUrl, toRawGitHubUrl, encodePath } from "../lib/parser.js";

describe("parseNotebookUrl — Colab", () => {
  test("colab /github URL → github descriptor", () => {
    const got = parseNotebookUrl(
      "https://colab.research.google.com/github/foo/bar/blob/main/path/to/nb.ipynb"
    );
    assert.deepEqual(got, {
      source: "github",
      user: "foo",
      repo: "bar",
      branch: "main",
      path: "path/to/nb.ipynb",
    });
  });

  test("colab /drive URL → drive descriptor", () => {
    const got = parseNotebookUrl("https://colab.research.google.com/drive/ABC123");
    assert.deepEqual(got, { source: "drive", fileId: "ABC123" });
  });

  test("colab /gist URL → gist descriptor", () => {
    const got = parseNotebookUrl("https://colab.research.google.com/gist/user/gist123");
    assert.deepEqual(got, { source: "gist", user: "user", gistId: "gist123" });
  });
});

describe("parseNotebookUrl — GitHub", () => {
  test("github blob URL pointing at .ipynb", () => {
    const got = parseNotebookUrl(
      "https://github.com/foo/bar/blob/main/notebooks/demo.ipynb"
    );
    assert.deepEqual(got, {
      source: "github",
      user: "foo",
      repo: "bar",
      branch: "main",
      path: "notebooks/demo.ipynb",
    });
  });

  test("raw.githubusercontent .ipynb", () => {
    const got = parseNotebookUrl(
      "https://raw.githubusercontent.com/foo/bar/main/notebooks/demo.ipynb"
    );
    assert.deepEqual(got, {
      source: "github",
      user: "foo",
      repo: "bar",
      branch: "main",
      path: "notebooks/demo.ipynb",
    });
  });

  test("non-ipynb github blob returns null", () => {
    assert.equal(parseNotebookUrl("https://github.com/foo/bar/blob/main/README.md"), null);
  });
});

describe("parseNotebookUrl — gist and nbviewer", () => {
  test("gist.github.com URL", () => {
    const got = parseNotebookUrl("https://gist.github.com/alice/abc123");
    assert.deepEqual(got, { source: "gist", user: "alice", gistId: "abc123" });
  });

  test("nbviewer.org github URL", () => {
    const got = parseNotebookUrl(
      "https://nbviewer.org/github/foo/bar/blob/main/x.ipynb"
    );
    assert.deepEqual(got, {
      source: "github",
      user: "foo",
      repo: "bar",
      branch: "main",
      path: "x.ipynb",
    });
  });
});

describe("parseNotebookUrl — invalid", () => {
  test("non-URL returns null", () => {
    assert.equal(parseNotebookUrl("not a url"), null);
    assert.equal(parseNotebookUrl(""), null);
    assert.equal(parseNotebookUrl(null), null);
  });

  test("unsupported host returns null", () => {
    assert.equal(parseNotebookUrl("https://example.com/foo"), null);
  });
});

describe("encodePath", () => {
  test("encodes segments but keeps slashes", () => {
    assert.equal(encodePath("foo bar/baz qux.ipynb"), "foo%20bar/baz%20qux.ipynb");
  });
});

describe("toGitHubBlobUrl / toRawGitHubUrl", () => {
  const info = { source: "github", user: "foo", repo: "bar", branch: "main", path: "x y.ipynb" };
  test("blob URL", () => {
    assert.equal(
      toGitHubBlobUrl(info),
      "https://github.com/foo/bar/blob/main/x%20y.ipynb"
    );
  });
  test("raw URL", () => {
    assert.equal(
      toRawGitHubUrl(info),
      "https://raw.githubusercontent.com/foo/bar/main/x%20y.ipynb"
    );
  });
  test("returns null for non-github source", () => {
    assert.equal(toGitHubBlobUrl({ source: "drive", fileId: "x" }), null);
    assert.equal(toRawGitHubUrl(null), null);
  });
});
