import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";

import {
  DEFAULT_REGISTRY_REF,
  RegistryError,
  fetchFile,
  fetchRegistry,
  getComponentLocation,
  getRemoteRegistryBase,
  getRemoteUrl,
  getSharedManifestPath,
  fetchSharedManifest,
  parseSharedManifest,
  resolveRegistrySource,
  pinRegistrySource,
  resolveSharedPieces,
  validateComponentName,
  validateRef,
} from "./registry";
import type { SharedManifest } from "./registry";
import type { SublayConfig } from "../commands/init";

const MAIN_BASE =
  "https://raw.githubusercontent.com/sublay-io/monorepo/main/registry";

const baseConfig: SublayConfig = {
  platform: "react",
  style: "styled",
  typescript: true,
  paths: { components: "src/components" },
  aliases: { "@/components": "@/components" },
};

describe("validateRef", () => {
  it.each(["main", "v8", "v8-shared-registry", "release_1.2", "feature/shared-pieces", "a/b/c"])(
    "accepts %s",
    (ref) => {
      expect(validateRef(ref)).toBeNull();
    }
  );

  it.each([
    ["an empty ref", ""],
    ["a space", "my branch"],
    ["a query string", "v8?x=1"],
    ["a fragment", "v8#x"],
    ["a percent escape", "v8%2F.."],
    ["a backslash", "a\\b"],
    ["a colon", "https://evil.example"],
    ["a lone .. segment", ".."],
    ["a .. segment in the middle", "a/../b"],
    ["a trailing .. segment", "a/.."],
    ["a leading slash", "/v8"],
    ["a trailing slash", "v8/"],
    ["an empty segment", "a//b"],
  ])("rejects %s", (_label, ref) => {
    expect(validateRef(ref)).toEqual(expect.any(String));
  });
});

describe("validateComponentName", () => {
  it.each(["comments-threaded", "comments-social", "notifications-control", "widget", "feed2", "a-1-b"])(
    "accepts %s",
    (name) => {
      expect(validateComponentName(name)).toBeNull();
    }
  );

  it.each([
    ["an empty name", ""],
    ["a path traversal", "../../../../x/y/main/registry/react/widget"],
    ["a parent segment", ".."],
    ["a slash", "comments/threaded"],
    ["a backslash", "comments\\threaded"],
    ["a dot", "comments.threaded"],
    ["uppercase", "Comments-Threaded"],
    ["an underscore", "comments_threaded"],
    ["a space", "comments threaded"],
    ["a leading hyphen", "-comments"],
    ["a trailing hyphen", "comments-"],
    ["a double hyphen", "comments--threaded"],
    ["a query string", "widget?x=1"],
    ["a percent escape", "widget%2F.."],
  ])("rejects %s, naming the argument", (_label, name) => {
    expect(validateComponentName(name)).toContain(`Invalid component name "${name}"`);
  });

  it("is enforced when a registry location is built", () => {
    expect(() =>
      getComponentLocation("../../../../x/y/main/registry/react/widget", baseConfig)
    ).toThrow(RegistryError);
  });

  it("makes no request for an invalid name", async () => {
    const requested: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      requested.push(url);
      return { ok: false, status: 404, statusText: "Not Found" };
    });
    try {
      const source = resolveRegistrySource("v8", {});
      await expect(
        fetchRegistry("../../../../x/y/main/registry/react/widget", baseConfig, source)
      ).rejects.toThrow(/Invalid component name/);
      expect(requested).toEqual([]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("getRemoteRegistryBase", () => {
  it("is the main registry for the default ref", () => {
    expect(DEFAULT_REGISTRY_REF).toBe("main");
    expect(getRemoteRegistryBase(undefined, {})).toBe(MAIN_BASE);
    expect(getRemoteRegistryBase("main", {})).toBe(MAIN_BASE);
  });

  it("swaps the ref segment for another branch", () => {
    expect(getRemoteRegistryBase("v8", {})).toBe(
      "https://raw.githubusercontent.com/sublay-io/monorepo/v8/registry"
    );
  });

  it("keeps a branch name containing a slash as it is", () => {
    expect(getRemoteRegistryBase("feature/shared-pieces", {})).toBe(
      "https://raw.githubusercontent.com/sublay-io/monorepo/feature/shared-pieces/registry"
    );
  });

  it("derives from the base URL override the same way", () => {
    const env = { SUBLAY_REGISTRY_BASE_URL: "http://127.0.0.1:9/o/r/main/registry/" };
    expect(getRemoteRegistryBase("main", env)).toBe("http://127.0.0.1:9/o/r/main/registry");
    expect(getRemoteRegistryBase("v8", env)).toBe("http://127.0.0.1:9/o/r/v8/registry");
  });

  it("refuses a base URL override without the main/registry suffix", () => {
    expect(() =>
      getRemoteRegistryBase("v8", { SUBLAY_REGISTRY_BASE_URL: "http://127.0.0.1:9/x" })
    ).toThrow(RegistryError);
  });
});

describe("resolveRegistrySource", () => {
  it("reads the local registry first and main remotely when no ref is given", () => {
    const source = resolveRegistrySource(undefined, {});
    expect(source.ref).toBe("main");
    expect(source.explicitRef).toBe(false);
    expect(source.localRoot).toEqual(expect.any(String));
    expect(source.remoteBase).toBe(MAIN_BASE);
  });

  it("honours the local path override", () => {
    const source = resolveRegistrySource(undefined, {
      SUBLAY_REGISTRY_LOCAL_PATH: "/tmp/fixture-registry",
    });
    expect(source.localRoot).toBe("/tmp/fixture-registry");
  });

  it("skips the local registry when a ref is given, even with the override set", () => {
    const source = resolveRegistrySource("v8", {
      SUBLAY_REGISTRY_LOCAL_PATH: "/tmp/fixture-registry",
    });
    expect(source.ref).toBe("v8");
    expect(source.explicitRef).toBe(true);
    expect(source.localRoot).toBeNull();
    expect(source.remoteBase).toBe(
      "https://raw.githubusercontent.com/sublay-io/monorepo/v8/registry"
    );
  });

  it("throws on an invalid ref", () => {
    expect(() => resolveRegistrySource("a/../b", {})).toThrow(RegistryError);
    expect(() => resolveRegistrySource("", {})).toThrow(RegistryError);
  });
});

describe("URL construction", () => {
  it("builds a component location from platform, component and style", () => {
    expect(getComponentLocation("comments-social", baseConfig)).toBe(
      "react/comments-social/styled"
    );
    expect(
      getComponentLocation("comments-threaded", {
        ...baseConfig,
        platform: "react-native",
        style: "tailwind",
      })
    ).toBe("react-native/comments-threaded/tailwind");
  });

  it("maps expo to the react-native registry", () => {
    expect(
      getComponentLocation("comments-social", { ...baseConfig, platform: "expo" })
    ).toBe("react-native/comments-social/styled");
  });

  it("builds file URLs from the ref, not from a manifest's registryUrl", () => {
    const source = resolveRegistrySource("feature/x", {});
    expect(getRemoteUrl(source, "react/comments-social/styled/files/a.tsx")).toBe(
      "https://raw.githubusercontent.com/sublay-io/monorepo/feature/x/registry/react/comments-social/styled/files/a.tsx"
    );
  });
});

describe("fetchRegistry / fetchFile", () => {
  let localRoot: string;
  let requested: string[];
  /** URL -> body, or a status code for a failure. */
  let remote: Record<string, string | number>;

  const manifest = {
    name: "widget",
    dependencies: [],
    files: [{ path: "files/widget.tsx", type: "component", description: "" }],
    // Deliberately names main: downloads must not follow it.
    registryUrl: `${MAIN_BASE}/react/widget/styled`,
    exports: { mainComponent: "Widget", mainFile: "widget" },
  };

  beforeEach(async () => {
    localRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sublay-registry-unit-"));
    requested = [];
    remote = {};
    vi.stubGlobal("fetch", async (url: string) => {
      requested.push(url);
      const hit = remote[url];
      if (hit === undefined || typeof hit === "number") {
        const status = typeof hit === "number" ? hit : 404;
        return { ok: false, status, statusText: status === 404 ? "Not Found" : "Error" };
      }
      return { ok: true, status: 200, statusText: "OK", text: async () => hit };
    });
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await fs.remove(localRoot);
  });

  const env = () => ({ SUBLAY_REGISTRY_LOCAL_PATH: localRoot });

  it("requests the main URLs when no ref is given and nothing is local", async () => {
    remote[`${MAIN_BASE}/react/widget/styled/registry.json`] = JSON.stringify(manifest);
    remote[`${MAIN_BASE}/react/widget/styled/files/widget.tsx`] = "export {}";

    const source = resolveRegistrySource(undefined, env());
    const registry = await fetchRegistry("widget", baseConfig, source);
    const content = await fetchFile(source, "react/widget/styled", registry.files[0].path);

    expect(content).toBe("export {}");
    expect(requested).toEqual([
      `${MAIN_BASE}/react/widget/styled/registry.json`,
      `${MAIN_BASE}/react/widget/styled/files/widget.tsx`,
    ]);
  });

  it("reads the local registry without any request when it has the component", async () => {
    const dir = path.join(localRoot, "react", "widget", "styled");
    await fs.outputJson(path.join(dir, "registry.json"), manifest);
    await fs.outputFile(path.join(dir, "files", "widget.tsx"), "local");

    const source = resolveRegistrySource(undefined, env());
    const registry = await fetchRegistry("widget", baseConfig, source);

    expect(registry.exports.mainComponent).toBe("Widget");
    expect(await fetchFile(source, "react/widget/styled", "files/widget.tsx")).toBe("local");
    expect(requested).toEqual([]);
  });

  it("requests everything from the chosen ref and does not read the local registry", async () => {
    const dir = path.join(localRoot, "react", "widget", "styled");
    await fs.outputJson(path.join(dir, "registry.json"), manifest);
    await fs.outputFile(path.join(dir, "files", "widget.tsx"), "local");

    const refBase = "https://raw.githubusercontent.com/sublay-io/monorepo/feature/x/registry";
    remote[`${refBase}/react/widget/styled/registry.json`] = JSON.stringify(manifest);
    remote[`${refBase}/react/widget/styled/files/widget.tsx`] = "from the branch";

    const source = resolveRegistrySource("feature/x", env());
    const registry = await fetchRegistry("widget", baseConfig, source);
    const content = await fetchFile(source, "react/widget/styled", registry.files[0].path);

    expect(content).toBe("from the branch");
    expect(requested).toEqual([
      `${refBase}/react/widget/styled/registry.json`,
      `${refBase}/react/widget/styled/files/widget.tsx`,
    ]);
  });

  it("names the component when the branch exists but the component does not", async () => {
    const refBase = "https://raw.githubusercontent.com/sublay-io/monorepo/v8/registry";
    remote[`${refBase}/package.json`] = "{}";

    const source = resolveRegistrySource("v8", env());
    await expect(fetchRegistry("nope", baseConfig, source)).rejects.toThrow(
      'Component "nope" with style "styled" not found on branch "v8".'
    );
    expect(requested).toEqual([
      `${refBase}/react/nope/styled/registry.json`,
      `${refBase}/package.json`,
    ]);
  });

  it("names the branch when the branch does not exist", async () => {
    const source = resolveRegistrySource("no-such-branch", env());
    await expect(fetchRegistry("widget", baseConfig, source)).rejects.toThrow(
      'Branch "no-such-branch" not found'
    );
  });

  it("reports a missing component on the default ref without a probe", async () => {
    const source = resolveRegistrySource(undefined, env());
    await expect(fetchRegistry("nope", baseConfig, source)).rejects.toThrow(
      'Component "nope" with style "styled" not found in registry.'
    );
    expect(requested).toEqual([`${MAIN_BASE}/react/nope/styled/registry.json`]);
  });

  it("reports a server error as a failed fetch, not as a missing component", async () => {
    remote[`${MAIN_BASE}/react/widget/styled/registry.json`] = 500;
    const source = resolveRegistrySource(undefined, env());
    await expect(fetchRegistry("widget", baseConfig, source)).rejects.toThrow(
      /Failed to fetch registry from .*registry\.json: 500/
    );
  });

  it("throws naming the file when a file cannot be fetched", async () => {
    const source = resolveRegistrySource("v8", env());
    const failure = fetchFile(source, "react/widget/styled", "files/widget.tsx");
    await expect(failure).rejects.toThrow(RegistryError);
    await expect(failure).rejects.toThrow(/Could not fetch files\/widget\.tsx from .*: 404/);
  });

  it("throws naming the file when the request itself fails", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new Error("connect ECONNREFUSED");
    });
    const source = resolveRegistrySource("v8", env());
    await expect(
      fetchFile(source, "react/widget/styled", "files/widget.tsx")
    ).rejects.toThrow(/Could not fetch files\/widget\.tsx .*ECONNREFUSED/);
  });
});

describe("shared pieces", () => {
  const labels = {
    componentManifest: "react/widget/styled/registry.json",
    sharedManifest: "shared/react/shared.json",
  };

  const piece = (requires: string[] = [], dependencies: string[] = [], name = "") => ({
    files: [`${name || "file"}.tsx`],
    requires,
    dependencies,
  });

  const manifest: SharedManifest = {
    platform: "react",
    pieces: {
      "giphy-container": piece(["magnifying-glass-icon", "reset-styles"], ["@giphy/react-components@^10.1.1"]),
      "magnifying-glass-icon": piece(),
      "user-avatar": piece(["get-user-avatar", "reset-styles"]),
      "get-user-avatar": piece(["reset-styles"]),
      "reset-styles": piece(),
      "from-now": piece([], ["moment@^2"]),
    },
  };

  const names = (list: { name: string }[]) => list.map((item) => item.name);

  it("puts the shared manifest under the platform's shared folder", () => {
    expect(getSharedManifestPath("react")).toBe("shared/react/shared.json");
    expect(getSharedManifestPath("react-native")).toBe("shared/react-native/shared.json");
  });

  it("returns nothing for an empty list", () => {
    expect(resolveSharedPieces([], manifest, labels)).toEqual([]);
  });

  it("follows requirements transitively, requirements first", () => {
    expect(names(resolveSharedPieces(["user-avatar"], manifest, labels))).toEqual([
      "reset-styles",
      "get-user-avatar",
      "user-avatar",
    ]);
  });

  it("installs each piece once however many pieces need it", () => {
    const resolved = names(
      resolveSharedPieces(
        ["giphy-container", "user-avatar", "reset-styles", "giphy-container"],
        manifest,
        labels
      )
    );
    expect(resolved).toEqual([
      "magnifying-glass-icon",
      "reset-styles",
      "giphy-container",
      "get-user-avatar",
      "user-avatar",
    ]);
    expect(new Set(resolved).size).toBe(resolved.length);
  });

  it("carries each piece's files and packages", () => {
    const [fromNow] = resolveSharedPieces(["from-now"], manifest, labels);
    expect(fromNow).toEqual({
      name: "from-now",
      files: ["file.tsx"],
      requires: [],
      dependencies: ["moment@^2"],
    });
  });

  it("fails on an unknown piece, naming the piece and both manifests", () => {
    expect(() => resolveSharedPieces(["nope"], manifest, labels)).toThrow(
      'Shared piece "nope", listed in react/widget/styled/registry.json, is not defined in shared/react/shared.json.'
    );
  });

  it("fails on a requirement that does not resolve, naming both pieces", () => {
    const broken: SharedManifest = {
      platform: "react",
      pieces: { modal: piece(["missing-icon"]) },
    };
    expect(() => resolveSharedPieces(["modal"], broken, labels)).toThrow(
      'Shared piece "modal" requires "missing-icon", which is not defined in shared/react/shared.json.'
    );
  });

  it("does not treat an inherited object key as a piece", () => {
    expect(() => resolveSharedPieces(["constructor"], manifest, labels)).toThrow(RegistryError);
  });

  it("terminates on a requirement cycle and installs each piece once", () => {
    const cyclic: SharedManifest = {
      platform: "react",
      pieces: { a: piece(["b"]), b: piece(["c"]), c: piece(["a"]) },
    };
    expect(names(resolveSharedPieces(["a"], cyclic, labels)).sort()).toEqual(["a", "b", "c"]);
  });

  describe("parseSharedManifest", () => {
    it("accepts the documented shape", () => {
      expect(parseSharedManifest(manifest, "shared/react/shared.json")).toEqual(manifest);
    });

    it("treats missing requires and dependencies as empty", () => {
      const parsed = parseSharedManifest(
        { platform: "react", pieces: { modal: { files: ["modal.tsx"] } } },
        "shared/react/shared.json"
      );
      expect(parsed.pieces.modal).toEqual({
        files: ["modal.tsx"],
        requires: [],
        dependencies: [],
      });
    });

    it.each([
      ["a non-object", []],
      ["missing pieces", { platform: "react" }],
      ["a piece without files", { pieces: { modal: { files: [] } } }],
      ["a file above the shared folder", { pieces: { modal: { files: ["../components/foo.tsx"] } } }],
      ["a file that climbs out part-way", { pieces: { modal: { files: ["a/../../foo.tsx"] } } }],
      ["an absolute file path", { pieces: { modal: { files: ["/etc/passwd"] } } }],
      ["a piece whose requires is not a list", { pieces: { modal: { files: ["m.tsx"], requires: "x" } } }],
      ["a piece whose dependencies are not strings", { pieces: { modal: { files: ["m.tsx"], dependencies: [1] } } }],
    ])("rejects %s, naming the manifest", (_label, raw) => {
      expect(() => parseSharedManifest(raw, "shared/react/shared.json")).toThrow(
        /shared\/react\/shared\.json is malformed/
      );
    });
  });

  describe("fetchSharedManifest", () => {
    let requested: string[];

    beforeEach(() => {
      requested = [];
      vi.stubGlobal("fetch", async (url: string) => {
        requested.push(url);
        if (url.endsWith("/v8/registry/shared/react-native/shared.json")) {
          return {
            ok: true,
            status: 200,
            statusText: "OK",
            text: async () => JSON.stringify({ platform: "react-native", pieces: {} }),
          };
        }
        return { ok: false, status: 404, statusText: "Not Found" };
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("reads the platform's manifest from the chosen ref", async () => {
      const source = resolveRegistrySource("v8", {});
      const fetched = await fetchSharedManifest("react-native", source);
      expect(fetched).toEqual({ platform: "react-native", pieces: {} });
      expect(requested).toEqual([
        "https://raw.githubusercontent.com/sublay-io/monorepo/v8/registry/shared/react-native/shared.json",
      ]);
    });

    it("fails naming the manifest when it cannot be fetched", async () => {
      const source = resolveRegistrySource("v8", {});
      await expect(fetchSharedManifest("react", source)).rejects.toThrow(
        /Could not fetch the shared manifest shared\/react\/shared\.json/
      );
    });
  });
});

describe("pinRegistrySource", () => {
  const pinConfig: SublayConfig = {
    platform: "react",
    style: "styled",
    typescript: true,
    paths: { components: "src/components" },
    aliases: { "@/components": "./src/components" },
  };
  let localRoot: string;

  beforeEach(async () => {
    localRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sublay-pin-"));
    await fs.outputFile(
      path.join(localRoot, "react", "widget", "styled", "registry.json"),
      "{}"
    );
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await fs.remove(localRoot);
  });

  const localSource = () =>
    resolveRegistrySource(undefined, { SUBLAY_REGISTRY_LOCAL_PATH: localRoot });

  it("stays on the local registry when it holds the component's manifest", async () => {
    const pinned = await pinRegistrySource(localSource(), "widget", pinConfig);
    expect(pinned.localRoot).toBe(localRoot);
    expect(pinned.localOnly).toBe(true);
  });

  it("goes fully remote when the local registry lacks the component", async () => {
    const pinned = await pinRegistrySource(localSource(), "other", pinConfig);
    expect(pinned.localRoot).toBeNull();
  });

  it("leaves a --ref source alone", async () => {
    const source = resolveRegistrySource("v8", {});
    expect(await pinRegistrySource(source, "widget", pinConfig)).toBe(source);
  });

  it("does not fetch a file the local registry is missing from the remote", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const pinned = await pinRegistrySource(localSource(), "widget", pinConfig);

    await expect(
      fetchFile(pinned, "react/widget/styled", "files/missing.tsx")
    ).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
