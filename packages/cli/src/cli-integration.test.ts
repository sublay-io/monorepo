import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { spawn } from "node:child_process";
import http from "node:http";
import type { AddressInfo } from "node:net";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { fileURLToPath } from "node:url";

// These drive the real compiled binary, because the behaviours they guard are
// process-level (stdin/TTY handling, exit codes) and cannot be observed by
// importing the modules directly.
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliEntry = path.join(packageRoot, "dist", "index.js");
const packageVersion: string = fs.readJsonSync(
  path.join(packageRoot, "package.json")
).version;

beforeAll(() => {
  // The `test` script builds first, so a missing dist means something went
  // wrong upstream. Fail loudly rather than skipping — a silently skipped
  // suite is exactly the "no coverage" state these tests exist to end.
  if (!fs.existsSync(cliEntry)) {
    throw new Error(
      `${cliEntry} not found. Run \`pnpm --filter @sublay/cli run build\` first.`
    );
  }
});

interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Run the built CLI with stdin closed — i.e. no TTY and nothing to read — which
 * is how it runs under scripts, CI and agents.
 */
function runCli(
  args: string[],
  cwd: string,
  env: Record<string, string> = {}
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    // The registry overrides are only ever set by a test that passes them.
    const baseEnv = { ...process.env };
    delete baseEnv.SUBLAY_REGISTRY_LOCAL_PATH;
    delete baseEnv.SUBLAY_REGISTRY_BASE_URL;

    const child = spawn(process.execPath, [cliEntry, ...args], {
      cwd,
      env: { ...baseEnv, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

let workDir: string;

beforeEach(async () => {
  workDir = await fs.mkdtemp(path.join(os.tmpdir(), "sublay-cli-e2e-"));
});

afterEach(async () => {
  await fs.remove(workDir);
});

describe("sublay add", () => {
  it("finishes instead of hanging when dependencies are missing and there is no TTY", async () => {
    await fs.writeJson(path.join(workDir, "package.json"), {
      name: "consumer",
      dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
    });
    await fs.writeJson(path.join(workDir, "sublay.json"), {
      platform: "react",
      style: "styled",
      typescript: true,
      paths: { components: "src/components" },
      aliases: { "@/components": "./src/components" },
    });

    // comments-social declares @sublay/react-js and @sublay/ui-core-react-js,
    // neither of which the fixture package.json has — so this hits the
    // "missing dependencies" branch that used to sit on an unanswerable prompt.
    const result = await runCli(["add", "comments-social"], workDir);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("install them later");
    expect(
      await fs.pathExists(
        path.join(workDir, "src", "components", "comments-social")
      )
    ).toBe(true);
    // The 15s cap is the vitest testTimeout in vitest.config.ts: an
    // unanswerable prompt would block forever and fail there.
  }, 15000);

  // sublay.json is a plain file on disk — hand-edited, half-written by
  // non-interactive scaffolding, or copied between projects. Each of these used
  // to escape as a raw stack trace (`TypeError: Cannot read properties of
  // undefined`, `SyntaxError: ... in JSON`) rather than actionable guidance.
  const malformedConfigs: Array<{ label: string; contents: string }> = [
    {
      label: "missing aliases",
      contents: JSON.stringify({
        platform: "react",
        style: "styled",
        typescript: true,
        paths: { components: "src/components" },
      }),
    },
    {
      label: "missing paths",
      contents: JSON.stringify({
        platform: "react",
        style: "styled",
        typescript: true,
        aliases: { "@/components": "./src/components" },
      }),
    },
    {
      label: "invalid JSON",
      // A trailing comma — valid to a human, fatal to JSON.parse.
      contents:
        '{"platform":"react","style":"styled","typescript":true,' +
        '"paths":{"components":"src/components"},' +
        '"aliases":{"@/components":"./src/components"},}',
    },
  ];

  for (const { label, contents } of malformedConfigs) {
    it(`exits cleanly with actionable guidance when sublay.json has ${label}`, async () => {
      await fs.writeJson(path.join(workDir, "package.json"), {
        name: "consumer",
        dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
      });
      await fs.writeFile(path.join(workDir, "sublay.json"), contents, "utf-8");

      const result = await runCli(["add", "comments-social"], workDir);
      const output = result.stdout + result.stderr;

      expect(result.code).toBe(1);
      expect(output).toContain("sublay.json is missing or malformed");
      expect(output).toContain("npx @sublay/cli init");
      // No internal exception should reach the user.
      expect(output).not.toMatch(/TypeError|SyntaxError|\bat .*\.js:\d+/);
      // And nothing should have been written to the project.
      expect(await fs.pathExists(path.join(workDir, "src"))).toBe(false);
    }, 15000);
  }
});

// ---------------------------------------------------------------------------
// Shared pieces and --ref.
//
// The real registry on this branch has no shared pieces, so these use the
// small registry in test-fixtures/registry (same layout as the repo's
// registry/): `react/widget` uses shared pieces from files at several folder
// depths, `react/plain` uses none, `react/unknown-piece`,
// `react/unresolved-requirement` and `react/unlisted-import` are each broken
// one way, and `react-native/widget` is what an Expo project installs.
//
// Two undocumented environment variables point the CLI at it:
// SUBLAY_REGISTRY_LOCAL_PATH replaces the repo's registry/ as the local
// registry, and SUBLAY_REGISTRY_BASE_URL replaces the GitHub base URL — here
// with a local HTTP server, so nothing in this file touches the network.
// ---------------------------------------------------------------------------

const fixtureRegistry = path.join(packageRoot, "test-fixtures", "registry");
const repoRegistry = path.resolve(packageRoot, "..", "..", "registry");

async function writeProject(
  dir: string,
  config: { platform?: string; style?: string; typescript?: boolean } = {},
  dependencies: Record<string, string> = { react: "^19.0.0" }
): Promise<void> {
  await fs.writeJson(path.join(dir, "package.json"), { name: "consumer", dependencies });
  await fs.writeJson(path.join(dir, "sublay.json"), {
    platform: config.platform ?? "react",
    style: config.style ?? "styled",
    typescript: config.typescript ?? true,
    paths: { components: "src/components" },
    aliases: { "@/components": "./src/components" },
  });
}

/** Every file under `dir`, as sorted forward-slash paths relative to it. */
async function listFiles(dir: string): Promise<string[]> {
  const found: string[] = [];
  const walk = async (current: string) => {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else {
        found.push(path.relative(dir, full).split(path.sep).join("/"));
      }
    }
  };
  await walk(dir);
  return found.sort();
}

async function readAll(dir: string): Promise<string> {
  const files = await listFiles(dir);
  const contents = await Promise.all(
    files.map((file) => fs.readFile(path.join(dir, file), "utf-8"))
  );
  return contents.join("\n");
}

const local = { SUBLAY_REGISTRY_LOCAL_PATH: fixtureRegistry };

describe("sublay add — shared pieces", () => {
  const installed = () => path.join(workDir, "src", "components", "widget");

  it("installs the closure of a component's shared pieces and rewrites the imports", async () => {
    await writeProject(workDir);

    const result = await runCli(["add", "widget"], workDir, local);

    expect(result.code).toBe(0);
    expect(await listFiles(installed())).toEqual([
      "components/parts/row/row.tsx",
      "components/widget.tsx",
      "hooks/use-widget.ts",
      "index.ts",
      // user-avatar and from-now are listed; get-user-avatar and reset-styles
      // come in through user-avatar's requirements. `unused` and `orphan` are
      // in the shared manifest but nothing asks for them.
      "shared/from-now.tsx",
      "shared/get-user-avatar.ts",
      "shared/reset-styles.ts",
      "shared/user-avatar.tsx",
      "utils/format.ts",
    ]);

    expect(await readAll(installed())).not.toContain("~shared/");

    // The relative path depends on how deep the importing file sits.
    const read = (file: string) => fs.readFile(path.join(installed(), file), "utf-8");
    expect(await read("components/widget.tsx")).toContain(
      'import { UserAvatar } from "../shared/user-avatar";'
    );
    const row = await read("components/parts/row/row.tsx");
    expect(row).toContain("import { FromNow } from '../../../shared/from-now';");
    expect(row).toContain('import { resetDiv } from "../../../shared/reset-styles";');
    expect(await read("hooks/use-widget.ts")).toContain('import("../shared/from-now")');
    // Shared files import each other relatively and are written as they are.
    expect(await read("shared/user-avatar.tsx")).toBe(
      await fs.readFile(path.join(fixtureRegistry, "shared", "react", "user-avatar.tsx"), "utf-8")
    );

    expect(result.stdout).toContain("Successfully installed 9 files");
    expect(result.stdout).toMatch(/Shared pieces in .*widget.shared: /);
    for (const piece of ["user-avatar", "get-user-avatar", "reset-styles", "from-now"]) {
      expect(result.stdout).toContain(piece);
    }
  });

  it("offers the shared pieces' packages once, with the component's range winning", async () => {
    await writeProject(workDir);

    const result = await runCli(["add", "widget"], workDir, local);

    expect(result.code).toBe(0);
    // The component asks for moment@^2.30.0 and from-now for moment@^2.
    expect(result.stdout).toContain(
      "npm install @sublay/react-js@^7.0.0 moment@^2.30.0 @giphy/js-fetch-api@^5.7.0\n"
    );
    expect(result.stdout).not.toContain("moment@^2 ");
    // A piece that is not installed contributes nothing.
    expect(result.stdout).not.toContain("left-pad");
  });

  it("gives a JavaScript project .js and .jsx shared files", async () => {
    await writeProject(workDir, { typescript: false });

    const result = await runCli(["add", "widget"], workDir, local);

    expect(result.code).toBe(0);
    expect(await listFiles(installed())).toEqual([
      "components/parts/row/row.jsx",
      "components/widget.jsx",
      "hooks/use-widget.js",
      "index.js",
      "shared/from-now.jsx",
      "shared/get-user-avatar.js",
      "shared/reset-styles.js",
      "shared/user-avatar.jsx",
      "utils/format.js",
    ]);

    const all = await readAll(installed());
    expect(all).not.toContain("~shared/");
    expect(all).not.toContain("interface ");
    expect(all).not.toContain(": Record<");
    expect(
      await fs.readFile(path.join(installed(), "components", "widget.jsx"), "utf-8")
    ).toContain('from "../shared/user-avatar"');
  });

  it("installs a component without shared pieces exactly as its manifest lists it", async () => {
    await writeProject(workDir);

    const result = await runCli(["add", "plain"], workDir, local);

    expect(result.code).toBe(0);
    expect(await listFiles(path.join(workDir, "src", "components", "plain"))).toEqual([
      "components/plain.tsx",
      "hooks/use-plain.ts",
      "index.ts",
    ]);
    expect(result.stdout).toContain("Successfully installed 3 files");
    expect(result.stdout).not.toContain("Shared pieces");
    expect(result.stdout).not.toContain("shared piece");
  });

  it("reads the react-native shared pieces for an Expo project", async () => {
    await writeProject(workDir, { platform: "expo" }, { "@sublay/expo": "^7.13.0" });

    const result = await runCli(["add", "widget"], workDir, local);

    expect(result.code).toBe(0);
    expect(await listFiles(installed())).toEqual([
      "components/widget.tsx",
      "index.ts",
      "shared/from-now.tsx",
    ]);
    const all = await readAll(installed());
    expect(all).not.toContain("~shared/");
    // The Expo package rename reaches shared files and their packages too.
    expect(all).not.toContain("@sublay/react-native");
    expect(all).toContain('from "@sublay/expo"');
    expect(result.stdout).not.toContain("@sublay/react-native");
    expect(result.stdout).toContain("npm install moment@^2\n");
  });

  it("offers an upgrade when the project's @sublay package is below what the component needs", async () => {
    await writeProject(workDir, {}, { "@sublay/react-js": "^6.4.0", moment: "^2.30.0" });

    const result = await runCli(["add", "widget"], workDir, local);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Dependencies that need an upgrade:");
    expect(result.stdout).toContain("@sublay/react-js@^7.0.0 (your project has ^6.4.0)");
    expect(result.stdout).toContain(
      "npm install @giphy/js-fetch-api@^5.7.0 @sublay/react-js@^7.0.0\n"
    );
  });

  for (const typescript of [true, false]) {
    it(`writes an empty registry file as an empty file (typescript: ${typescript})`, async () => {
      await writeProject(workDir, { typescript });

      const result = await runCli(["add", "empty-file"], workDir, local);
      const output = result.stdout + result.stderr;

      expect(result.code).toBe(0);
      expect(output).not.toMatch(/Babel|Failed to|\bat .*\.js:\d+/);

      const dir = path.join(workDir, "src", "components", "empty-file");
      const ext = typescript ? "ts" : "js";
      expect(await listFiles(dir)).toEqual([
        `components/widget.${ext}x`,
        `index.${ext}`,
        `utils/placeholder.${ext}`,
      ]);
      expect(await fs.readFile(path.join(dir, "utils", `placeholder.${ext}`), "utf-8")).toBe("");
    });
  }

  it.each([
    "../../../../x/y/main/registry/react/widget",
    "..",
    "react/widget",
    "Widget",
    "widget_one",
  ])("rejects the component name %j and writes nothing", async (name) => {
    await writeProject(workDir);

    const result = await runCli(["add", name], workDir, local);
    const output = result.stdout + result.stderr;

    expect(result.code).toBe(1);
    expect(output).toContain(`Invalid component name "${name}"`);
    expect(output).not.toMatch(/\bat .*\.js:\d+/);
    expect(await listFiles(workDir)).toEqual(["package.json", "sublay.json"]);
  });

  const broken: Array<{ component: string; label: string; message: RegExp }> = [
    {
      component: "unknown-piece",
      label: "a shared piece that is not defined",
      message:
        /Shared piece "nope", listed in react\/unknown-piece\/styled\/registry\.json, is not defined in shared\/react\/shared\.json/,
    },
    {
      component: "unresolved-requirement",
      label: "a shared piece whose requirement does not resolve",
      message:
        /Shared piece "orphan" requires "missing-piece", which is not defined in shared\/react\/shared\.json/,
    },
    {
      component: "unlisted-import",
      label: "a file that imports a shared piece the manifest does not list",
      message:
        /files\/widget\.tsx imports the shared piece "react\/from-now", which react\/unlisted-import\/styled\/registry\.json does not list/,
    },
  ];

  for (const { component, label, message } of broken) {
    it(`fails and writes nothing for ${label}`, async () => {
      await writeProject(workDir);

      const result = await runCli(["add", component], workDir, local);
      const output = result.stdout + result.stderr;

      expect(result.code).toBe(1);
      expect(output).toMatch(message);
      expect(output).not.toMatch(/\bat .*\.js:\d+/);
      expect(await fs.pathExists(path.join(workDir, "src"))).toBe(false);
    });
  }
});

describe("sublay add — env file per framework", () => {
  const installed = () => path.join(workDir, "src", "components", "framed");
  const fixture = (file: string) =>
    fs.readFile(path.join(fixtureRegistry, "react", "framed", "styled", file), "utf-8");

  it.each([
    ["next", { react: "^19.0.0", next: "^15.0.0" }, "env/next.ts"],
    ["vite (not listed: the default file)", { react: "^19.0.0", vite: "^5.0.0" }, "utils/env.ts"],
    ["no recognised framework", { react: "^19.0.0" }, "env/other.ts"],
  ])("installs the env file for %s as utils/env.ts", async (_label, dependencies, source) => {
    await writeProject(workDir, {}, dependencies);

    const result = await runCli(["add", "framed"], workDir, local);

    expect(result.code).toBe(0);
    expect(await listFiles(installed())).toEqual([
      "components/framed.tsx",
      "index.ts",
      "utils/env.ts",
    ]);
    expect(await fs.readFile(path.join(installed(), "utils", "env.ts"), "utf-8")).toBe(
      await fixture(source)
    );
  });
});

describe("sublay add — --ref", () => {
  // Serves the fixture registry the way raw.githubusercontent.com serves the
  // repo: /<org>/<repo>/<ref>/registry/<path>. Each served source file gets a
  // trailing comment naming the ref it was requested from, so a test can tell
  // which branch a file came from and that it did not come from disk.
  const refs = ["main", "v8", "feature/shared-pieces"];
  let server: http.Server;
  let baseUrl: string;
  let requests: string[];
  /** Registry paths (after `/registry/`) the server answers 404 for. */
  let missing: Set<string>;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const url = decodeURIComponent((req.url ?? "").split("?")[0]);
      requests.push(url);

      const ref = refs.find((candidate) => url.startsWith(`/o/r/${candidate}/registry/`));
      const registryPath = ref ? url.slice(`/o/r/${ref}/registry/`.length) : "";
      // registry/package.json exists on every ref of the real repo; the CLI
      // probes it to tell a missing branch from a missing component.
      if (ref && registryPath === "package.json") {
        res.writeHead(200).end("{}");
        return;
      }

      const file = path.join(fixtureRegistry, ...registryPath.split("/"));
      const servable =
        ref !== undefined &&
        !registryPath.split("/").includes("..") &&
        !missing.has(registryPath) &&
        fs.existsSync(file) &&
        fs.statSync(file).isFile();

      if (!servable) {
        res.writeHead(404).end("404: Not Found");
        return;
      }

      const body = fs.readFileSync(file, "utf-8");
      res
        .writeHead(200)
        .end(/\.tsx?$/.test(file) ? `${body}\n// ref: ${ref}\n` : body);
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}/o/r/main/registry`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    requests = [];
    missing = new Set();
  });

  // The local registry is set too: with --ref it must not be read.
  const remote = () => ({
    SUBLAY_REGISTRY_BASE_URL: baseUrl,
    SUBLAY_REGISTRY_LOCAL_PATH: fixtureRegistry,
  });

  const installed = () => path.join(workDir, "src", "components", "widget");

  for (const ref of ["v8", "feature/shared-pieces"]) {
    it(`reads the manifest, files and shared pieces from the branch ${ref}`, async () => {
      await writeProject(workDir);

      const result = await runCli(["add", "widget", "--ref", ref], workDir, remote());

      expect(result.code).toBe(0);

      const files = await listFiles(installed());
      expect(files).toEqual([
        "components/parts/row/row.tsx",
        "components/widget.tsx",
        "hooks/use-widget.ts",
        "index.ts",
        "shared/from-now.tsx",
        "shared/get-user-avatar.ts",
        "shared/reset-styles.ts",
        "shared/user-avatar.tsx",
        "utils/format.ts",
      ]);

      // Every downloaded file carries the server's marker for this ref, so
      // none of them was read from the local registry.
      for (const file of files.filter((name) => name !== "index.ts")) {
        expect(
          await fs.readFile(path.join(installed(), file), "utf-8"),
          file
        ).toContain(`// ref: ${ref}`);
      }
      expect(await readAll(installed())).not.toContain("~shared/");

      // And every request went to that ref: manifest, shared manifest, files.
      const prefix = `/o/r/${ref}/registry/`;
      expect(requests.every((url) => url.startsWith(prefix))).toBe(true);
      expect(requests.map((url) => url.slice(prefix.length)).sort()).toEqual([
        "react/widget/styled/files/parts/row/row.tsx",
        "react/widget/styled/files/widget.tsx",
        "react/widget/styled/hooks/use-widget.ts",
        "react/widget/styled/registry.json",
        "react/widget/styled/utils/format.ts",
        "shared/react/from-now.tsx",
        "shared/react/get-user-avatar.ts",
        "shared/react/reset-styles.ts",
        "shared/react/shared.json",
        "shared/react/user-avatar.tsx",
      ]);
    });
  }

  it("reads main from the remote when no ref is given and the component is not local", async () => {
    await writeProject(workDir);
    const emptyLocal = path.join(workDir, "no-registry-here");

    const result = await runCli(["add", "plain"], workDir, {
      SUBLAY_REGISTRY_BASE_URL: baseUrl,
      SUBLAY_REGISTRY_LOCAL_PATH: emptyLocal,
    });

    expect(result.code).toBe(0);
    expect(requests.sort()).toEqual([
      "/o/r/main/registry/react/plain/styled/files/plain.tsx",
      "/o/r/main/registry/react/plain/styled/hooks/use-plain.ts",
      "/o/r/main/registry/react/plain/styled/registry.json",
    ]);
    expect(
      await fs.readFile(
        path.join(workDir, "src", "components", "plain", "components", "plain.tsx"),
        "utf-8"
      )
    ).toContain("// ref: main");
  });

  it("does not use the remote at all when no ref is given and the component is local", async () => {
    await writeProject(workDir);

    const result = await runCli(["add", "widget"], workDir, remote());

    expect(result.code).toBe(0);
    expect(requests).toEqual([]);
    expect(await readAll(installed())).not.toContain("// ref:");
  });

  it("names the branch when the branch does not exist, and writes nothing", async () => {
    await writeProject(workDir);

    const result = await runCli(["add", "widget", "--ref", "no-such-branch"], workDir, remote());
    const output = result.stdout + result.stderr;

    expect(result.code).toBe(1);
    expect(output).toContain('Branch "no-such-branch" not found');
    expect(output).not.toContain("Component");
    expect(await fs.pathExists(path.join(workDir, "src"))).toBe(false);
  });

  it("names the component when the branch exists but the component does not, and writes nothing", async () => {
    await writeProject(workDir);

    const result = await runCli(["add", "no-such-component", "--ref", "v8"], workDir, remote());
    const output = result.stdout + result.stderr;

    expect(result.code).toBe(1);
    expect(output).toContain(
      'Component "no-such-component" with style "styled" not found on branch "v8".'
    );
    expect(output).not.toContain("Branch \"v8\" not found");
    expect(await fs.pathExists(path.join(workDir, "src"))).toBe(false);
  });

  it.each([
    ["a component file", "react/widget/styled/files/parts/row/row.tsx", "files/parts/row/row.tsx"],
    ["a shared file", "shared/react/reset-styles.ts", "reset-styles.ts"],
    ["the shared manifest", "shared/react/shared.json", "shared/react/shared.json"],
  ])("aborts and writes nothing when %s fails to download", async (_label, registryPath, named) => {
    await writeProject(workDir);
    missing.add(registryPath);

    const result = await runCli(["add", "widget", "--ref", "v8"], workDir, remote());
    const output = result.stdout + result.stderr;

    expect(result.code).toBe(1);
    expect(output).toContain("Could not fetch");
    expect(output).toContain(named);
    expect(output).toContain(`/o/r/v8/registry/${registryPath}`);
    expect(output).toContain("Nothing was written");
    expect(output).not.toContain("Successfully installed");
    expect(await fs.pathExists(path.join(workDir, "src"))).toBe(false);
  });

  it.each(["../../../../x/y/main/registry/react/widget", "../widget", "a/b"])(
    "rejects the component name %j with --ref without making a request",
    async (name) => {
      await writeProject(workDir);

      const result = await runCli(["add", name, "--ref", "v8"], workDir, remote());
      const output = result.stdout + result.stderr;

      expect(result.code).toBe(1);
      expect(output).toContain(`Invalid component name "${name}"`);
      expect(requests).toEqual([]);
      expect(await listFiles(workDir)).toEqual(["package.json", "sublay.json"]);
    }
  );

  it.each(["a/../b", "v8?x", "my branch", "..", "/v8"])(
    "rejects the ref %j without making a request",
    async (ref) => {
      await writeProject(workDir);

      const result = await runCli(["add", "widget", "--ref", ref], workDir, remote());
      const output = result.stdout + result.stderr;

      expect(result.code).toBe(1);
      expect(output).toContain("Invalid ref");
      expect(requests).toEqual([]);
      expect(await fs.pathExists(path.join(workDir, "src"))).toBe(false);
    }
  );
});

// ---------------------------------------------------------------------------
// Regression guard for the default path: every component in the repo's own
// registry, installed with no flags and no overrides, writes exactly the files
// its manifest lists (plus the barrel, plus its shared pieces when it lists
// any). The expected layout is spelled out here rather than taken from the
// CLI's own mapping, so a change to where files go fails this.
// ---------------------------------------------------------------------------

interface RealVariant {
  platform: string;
  component: string;
  style: string;
  manifest: {
    files: Array<{ path: string }>;
    shared?: string[];
  };
}

function findRealVariants(): RealVariant[] {
  const variants: RealVariant[] = [];
  for (const platform of ["react", "react-native"]) {
    const platformDir = path.join(repoRegistry, platform);
    if (!fs.existsSync(platformDir)) continue;
    for (const component of fs.readdirSync(platformDir)) {
      for (const style of ["styled", "tailwind"]) {
        const manifestPath = path.join(platformDir, component, style, "registry.json");
        if (fs.existsSync(manifestPath)) {
          variants.push({
            platform,
            component,
            style,
            manifest: fs.readJsonSync(manifestPath),
          });
        }
      }
    }
  }
  return variants;
}

/** Where the installed layout puts a manifest path, per the documented structure. */
function expectedInstalledPath(registryPath: string): string {
  const [top, ...rest] = registryPath.split("/");
  if (top === "files") return ["components", ...rest].join("/");
  if (top === "hooks" || top === "utils" || top === "context") {
    return [top, rest[rest.length - 1]].join("/");
  }
  return registryPath;
}

/** The files of a manifest's shared pieces and everything they require. */
function expectedSharedFiles(platform: string, names: string[]): string[] {
  if (names.length === 0) return [];
  const { pieces } = fs.readJsonSync(
    path.join(repoRegistry, "shared", platform, "shared.json")
  ) as { pieces: Record<string, { files: string[]; requires: string[] }> };

  const seen = new Set<string>();
  const visit = (name: string) => {
    if (seen.has(name)) return;
    seen.add(name);
    pieces[name].requires.forEach(visit);
  };
  names.forEach(visit);

  return [...seen].flatMap((name) => pieces[name].files.map((file) => `shared/${file}`));
}

describe("sublay add — every component in the repo registry", () => {
  const variants = findRealVariants();

  it("finds the repo registry", () => {
    expect(variants.length).toBeGreaterThan(0);
  });

  it("has only component names the add command accepts", () => {
    for (const { component } of variants) {
      expect(component, component).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  for (const { platform, component, style, manifest } of variants) {
    it(`installs ${platform}/${component}/${style} as exactly the files its manifest lists`, async () => {
      await writeProject(workDir, { platform, style });

      const result = await runCli(["add", component], workDir);

      expect(result.code).toBe(0);

      const expected = [
        ...manifest.files.map((file) => expectedInstalledPath(file.path)),
        ...expectedSharedFiles(platform, manifest.shared ?? []),
        "index.ts",
      ].sort();

      const componentDir = path.join(workDir, "src", "components", component);
      expect(await listFiles(componentDir)).toEqual(expected);
      // Nothing is written outside the component's own folder.
      expect(await listFiles(path.join(workDir, "src"))).toEqual(
        expected.map((file) => `components/${component}/${file}`)
      );
      expect(result.stdout).toContain(`Successfully installed ${expected.length} files`);
      expect(await readAll(componentDir)).not.toContain("~shared/");
    });
  }
});

describe("sublay init", () => {
  it("refuses to run without a TTY instead of writing a silent config", async () => {
    const result = await runCli(["init"], workDir);
    const output = result.stdout + result.stderr;

    expect(result.code).toBe(1);
    expect(output).toMatch(/TTY|interactive terminal/);
    expect(await fs.pathExists(path.join(workDir, "sublay.json"))).toBe(false);
  }, 15000);
});

describe("sublay --version", () => {
  it("prints the version from package.json", async () => {
    const result = await runCli(["--version"], workDir);

    expect(result.code).toBe(0);
    expect(result.stdout.trim()).toBe(packageVersion);
  }, 15000);
});
