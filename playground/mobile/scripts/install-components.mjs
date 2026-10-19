// Installs the four mobile comment variants (threaded and social, Tailwind and
// inline styles) into components/{tailwind,styled}/ from this monorepo's
// registry/, with this monorepo's CLI build: what `sublay add` would install,
// from the current checkout. Run `pnpm install` and
// `pnpm --filter @sublay/cli build` at the monorepo root first.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const monorepo = path.resolve(app, "../..");
// Run from packages/cli/dist, the CLI reads the monorepo's registry/ first
// (see utils/registry.ts), so nothing points it there.
const cli = path.join(monorepo, "packages/cli/dist/index.js");
const configPath = path.join(app, "sublay.json");

if (!fs.existsSync(cli)) {
  console.error(
    `No CLI build at ${cli}.\nIn the monorepo root, run \`pnpm install\` and \`pnpm --filter @sublay/cli build\` first.`
  );
  process.exit(1);
}

const original = fs.readFileSync(configPath, "utf8");
const config = JSON.parse(original);
const restore = () => fs.writeFileSync(configPath, original);
// sublay.json is switched per style below: put it back even on Ctrl-C.
process.on("SIGINT", () => {
  restore();
  process.exit(130);
});

try {
  for (const style of ["tailwind", "styled"]) {
    fs.writeFileSync(
      configPath,
      JSON.stringify({ ...config, style, paths: { components: `components/${style}` } }, null, 2) + "\n"
    );
    for (const component of ["comments-threaded", "comments-social"]) {
      console.log(`\n▶ ${style} ${component}`);
      // `add` overwrites files but never deletes them: start clean, so a file
      // the registry renamed or removed doesn't linger.
      fs.rmSync(path.join(app, "components", style, component), { recursive: true, force: true });
      execFileSync(process.execPath, [cli, "add", component], {
        cwd: app,
        stdio: ["ignore", "inherit", "inherit"],
      });
    }
  }
} finally {
  restore();
}
