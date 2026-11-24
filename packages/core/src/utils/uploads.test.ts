import { describe, it, expect, vi, afterEach } from "vitest";

import { appendFileList, appendImageList, updateIncludeFor } from "./uploads";

describe("updateIncludeFor", () => {
  it("sends files alone when the update changes files and the caller passed none", () => {
    expect(updateIncludeFor(undefined, true)).toBe("files");
  });

  it("treats an empty include as none", () => {
    expect(updateIncludeFor([] as "files"[], true)).toBe("files");
    expect(updateIncludeFor("" as "files", true)).toBe("files");
    expect(updateIncludeFor(" , " as "files", true)).toBe("files");
    expect(updateIncludeFor([] as "files"[], false)).toBeUndefined();
    expect(updateIncludeFor("" as "files", false)).toBeUndefined();
  });

  it("adds files to the caller's include when the update changes files and it's missing", () => {
    expect(updateIncludeFor(["other"] as unknown as "files"[], true)).toEqual(["other", "files"]);
  });

  it("keeps the caller's include as given when it already has files, or nothing changes", () => {
    expect(updateIncludeFor(["files"], true)).toEqual(["files"]);
    expect(updateIncludeFor("FILES" as "files", true)).toBe("FILES");
    expect(updateIncludeFor("files", false)).toBe("files");
    expect(updateIncludeFor(undefined, false)).toBeUndefined();
  });
});

describe("list uploads with React Native files", () => {
  // React Native's FormData takes `{ uri, name, type }`. jsdom's FormData
  // turns a non-Blob into a string, so record what is appended instead.
  afterEach(() => vi.restoreAllMocks());

  function recordAppends() {
    const form = new FormData();
    const parts: Array<[string, unknown]> = [];
    vi.spyOn(form, "append").mockImplementation((name: string, value: any) => {
      parts.push([name, value]);
    });
    return { form, parts };
  }

  it("defaults an image's type to image/jpeg and keeps a given type", () => {
    const { form, parts } = recordAppends();
    appendImageList(form, {
      files: [
        { uri: "file:///a.jpg", name: "a.jpg" },
        { uri: "file:///b.png", name: "b.png", type: "image/png" },
      ],
      options: { mode: "original-aspect", sizes: { full: 1080 } },
    });
    expect(parts.filter(([name]) => name === "images").map(([, v]) => v)).toEqual([
      { uri: "file:///a.jpg", name: "a.jpg", type: "image/jpeg" },
      { uri: "file:///b.png", name: "b.png", type: "image/png" },
    ]);
    expect(parts.find(([name]) => name === "images.options")?.[1]).toBe(
      JSON.stringify({ mode: "original-aspect", sizes: { full: 1080 } }),
    );
  });

  it("defaults a raw file's type to application/octet-stream and keeps a given type", () => {
    const { form, parts } = recordAppends();
    appendFileList(form, {
      files: [
        { uri: "file:///a.bin", name: "a.bin" },
        { uri: "file:///b.pdf", name: "b.pdf", type: "application/pdf" },
      ],
    });
    expect(parts).toEqual([
      ["files", { uri: "file:///a.bin", name: "a.bin", type: "application/octet-stream" }],
      ["files", { uri: "file:///b.pdf", name: "b.pdf", type: "application/pdf" }],
    ]);
  });
});
