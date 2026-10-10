import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const PROD_API_BASE = "https://api.sublay.io/v8";
const PROD_API_ORIGIN = "https://api.sublay.io";

// The workspace SDK packages, as Vite sees them after resolving the pnpm
// symlinks: <monorepo>/packages/<name>/dist/...
const SDK_DIST = path.resolve(__dirname, "../packages") + path.sep;

/**
 * Playground-only: the SDK hardcodes the production API base (REST base,
 * socket origin, OAuth base). When VITE_API_BASE_URL is set, rewrite those
 * literals in the workspace SDK dist files as they pass through Vite, so the
 * playground can talk to a local server without touching packages/.
 * Runs in both dev and build. Not added at all when the variable is unset.
 */
function sublayApiBaseOverride(apiBase: string): Plugin {
  const origin = new URL(apiBase).origin;
  return {
    name: "playground:sublay-api-base-override",
    enforce: "pre",
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
