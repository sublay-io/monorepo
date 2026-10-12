import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

const PROD_API_BASE = "https://api.sublay.io/v8";
const PROD_API_ORIGIN = "https://api.sublay.io";

// The workspace SDK packages, as Vite sees them after resolving the pnpm
// symlinks: <monorepo>/packages/<name>/dist/...
const SDK_DIST = path.resolve(__dirname, "../packages") + path.sep;

// The dist folders of the SDK packages the playground loads (the same
// packages as optimizeDeps.exclude below).
const SDK_DIST_DIRS = ["core", "react-js", "ui-core-react-js"].map((name) =>
  path.resolve(__dirname, "../packages", name, "dist"),
);

/** How many .js/.mjs/.cjs files under `dir` contain `needle`. */
function countFilesContaining(dir: string, needle: string): number {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countFilesContaining(full, needle);
    } else if (/\.(?:js|mjs|cjs)$/.test(entry.name)) {
      if (fs.readFileSync(full, "utf8").includes(needle)) count += 1;
    }
  }
  return count;
}

/**
 * Playground-only: the SDK hardcodes the production API base (REST base,
 * socket origin, OAuth base). When VITE_API_BASE_URL is set, rewrite those
 * literals in the workspace SDK dist files as they pass through Vite, so the
 * playground can talk to a local server without touching packages/.
 * Runs in both dev and build. Not added at all when the variable is unset.
 *
 * It fails loudly rather than fall back to production: an override that
 * rewrites nothing would leave the playground talking to api.sublay.io while
 * the banner says otherwise.
 *  - On startup (dev and build) it throws unless the production base is
 *    found in the SDK dist files on disk — the literal moved, or the SDK
 *    isn't built.
 *  - At the end of a build it throws if no module was actually rewritten.
 */
function sublayApiBaseOverride(apiBase: string): Plugin {
  const origin = new URL(apiBase).origin;
  let rewrittenModules = 0;
  let isBuild = false;
  return {
    name: "playground:sublay-api-base-override",
    enforce: "pre",
    configResolved(config) {
      isBuild = config.command === "build";
    },
    buildStart() {
      rewrittenModules = 0;
      const found = SDK_DIST_DIRS.reduce(
        (total, dir) => total + countFilesContaining(dir, PROD_API_ORIGIN),
        0,
      );
      if (found === 0) {
        throw new Error(
          `[playground] VITE_API_BASE_URL is set to "${apiBase}", but "${PROD_API_ORIGIN}" ` +
            `was not found in any SDK dist file (${SDK_DIST_DIRS.map((dir) =>
              path.relative(__dirname, dir),
            ).join(", ")}). The override would replace nothing and the playground ` +
            "would talk to production. Build the SDK (`pnpm react:build-all`), or update " +
            "PROD_API_BASE / PROD_API_ORIGIN in playground/vite.config.ts if the SDK's " +
            "base URL moved.",
        );
      }
    },
    buildEnd(error) {
      // Dev serves modules on demand, so only a build has seen them all here.
      if (error || !isBuild) return;
      if (rewrittenModules === 0) {
        throw new Error(
          `[playground] VITE_API_BASE_URL is set to "${apiBase}", but the override ` +
            "rewrote zero SDK modules in this build, so the bundle still points at " +
            `${PROD_API_BASE}. Check that the SDK packages are not pre-bundled or ` +
            "externalised (see optimizeDeps.exclude in playground/vite.config.ts).",
        );
      }
    },
    transform(code, id) {
      const file = id.split("?")[0];
      if (!file.startsWith(SDK_DIST) || !file.includes(`${path.sep}dist${path.sep}`)) {
        return null;
      }
      if (!code.includes(PROD_API_ORIGIN)) return null;
      const replaced = code
        .split(PROD_API_BASE)
        .join(apiBase)
        // Whatever is left is the bare origin (socket.io fallback).
        .split(PROD_API_ORIGIN)
        .join(origin);
      rewrittenModules += 1;
      return { code: replaced, map: null };
    },
  };
}

export default defineConfig(({ mode }) => {
  // Reads .env files and VITE_-prefixed shell variables (shell wins).
  const env = loadEnv(mode, __dirname, "VITE_");
  const apiBase = (env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");

  if (apiBase) {
    try {
      new URL(apiBase);
    } catch {
      throw new Error(
        `VITE_API_BASE_URL is not a valid URL: "${apiBase}" (expected e.g. http://localhost:5001/v8)`,
      );
    }
  }

  console.log(
    apiBase
      ? `\n[playground] API base: ${apiBase}  (VITE_API_BASE_URL override)\n`
      : `\n[playground] API base: ${PROD_API_BASE}  (production; set VITE_API_BASE_URL to override)\n`,
  );

  return {
    plugins: [...(apiBase ? [sublayApiBaseOverride(apiBase)] : []), react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        // Shared registry pieces: component files import them as
        // ~shared/<platform>/<piece> (rewritten to a relative path at install).
        "~shared": path.resolve(__dirname, "../registry/shared"),
      },
    },
    // Dep pre-bundling skips plugin transforms. Linked workspace packages are
    // not pre-bundled by default; excluding them explicitly keeps it that way
    // (including @sublay/core, which is only a transitive dependency here).
    optimizeDeps: {
      exclude: ["@sublay/core", "@sublay/react-js", "@sublay/ui-core-react-js"],
    },
  };
});
