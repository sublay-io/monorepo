#!/usr/bin/env node
// Publish-target gate: refuses an npm publish from the wrong branch or with a
// version that does not belong there. Context: plan-v8-beta.md §5.4 (engine root).
//
// The rule it protects: production (`latest`) ships from `main` only, and beta
// ships from the `v8` branch only. `main` carries the current 7.x SDKs; `v8`
// carries the in-progress 8.x SDKs and never merges into `main` until v8
// graduates. Nothing in CI publishes — every real publish is a manual local
// run of a root `{group}:publish-*` script — so the gate has to live in those
// scripts rather than in a workflow.
//
// Two modes, one rule set, so the rules cannot drift between them:
//
//   --channel prod|beta --group <group>
//       Run first in every root publish script. Knows which dist-tag is being
//       published to, so it enforces everything below.
//
//   --package
//       Run from a package's own `prepublishOnly`, with the package directory
//       as cwd. Catches a bare `pnpm --filter <pkg> publish` that bypasses the
//       root scripts. It cannot see the dist-tag, so it enforces the branch and
//       version-shape rules only — which, because prod and beta each have
//       exactly one allowed branch, still covers almost everything. The one
//       gap: a non-API package (cli, ui-core) published straight to `latest`
//       from `v8`.
//
//       Skipped entirely inside GitHub Actions. Every workflow runs
//       `pnpm publish --dry-run` as a test step, `prepublishOnly` fires during
//       a dry-run, and pnpm 11 exposes no dry-run signal to the hook (no
//       npm_config_dry_run) — while a pull_request checkout is a detached
//       merge commit, so this mode would refuse and redden every PR. Skipping
//       is safe only because nothing in CI publishes for real. If a workflow
//       ever starts publishing, this skip has to be revisited.
//
// Rules:
//
//   1. The branch must be resolvable. Detached HEAD or a git failure refuses.
//   2. Every package in a group shares one version. A half-finished bump
//      (core at 8.0.0-beta.1, react-js still at 7.13.4) refuses.
//   3. `prod` publishes from `main` only.
//   4. `beta` publishes from `v8` only.
//   5. `prod` never publishes a prerelease version (`-beta.N` and the like) —
//      that would make a beta the default `npm install` for everyone.
//   6. On `v8`, the API groups (react, node, js) must be an 8.x prerelease.
//      Catches a forgotten bump, or a plain 8.0.0 sitting on the dev branch.
//      (`npm version patch|minor` on 8.0.0-beta.0 yields 8.0.0, so the ordinary
//      bump scripts silently do exactly that.)
//   7. On `main`, the API groups must not be 8.x until V8_GRADUATED is flipped.
//      That constant is the whole graduation switch for this file.
//
// cli and ui-core have no @sublay/* dependencies, are not tied to the API
// version, and stay on 7.x; rules 6 and 7 do not apply to them.
//
// Node built-ins only, so it can run before (or without) an install.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const V8_GRADUATED = false;

const PROD_BRANCH = 'main';
const BETA_BRANCH = 'v8';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..');

// Package directories per publish group — must match the --filter lists of the
// root package.json `{group}:publish-*` scripts.
const GROUPS = {
  react: ['core', 'react-js', 'react-native', 'expo'],
  'ui-core': ['ui-core-react-js', 'ui-core-react-native'],
  cli: ['cli'],
  node: ['node'],
  js: ['js'],
};
const API_GROUPS = new Set(['react', 'node', 'js']);

function fail(problems) {
  console.error(`\nPublish refused — ${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    `\nProduction publishes from \`${PROD_BRANCH}\` only; beta publishes from \`${BETA_BRANCH}\` only.\n` +
      'See plan-v8-beta.md §5.4 at the engine root.'
  );
  process.exit(1);
}

function currentBranch() {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}

function readManifest(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
}

const isPrerelease = (version) => version.includes('-');
const majorOf = (version) => Number.parseInt(version.split('.')[0], 10);

// Rules 6 and 7, shared by both modes.
function versionShapeProblems(branch, label, version, isApi) {
  if (!isApi) return [];
  const problems = [];
  if (branch === BETA_BRANCH && !(majorOf(version) === 8 && isPrerelease(version))) {
    problems.push(
      `${label} is ${version}; on \`${BETA_BRANCH}\` it must be an 8.x prerelease (e.g. 8.0.0-beta.1).`
    );
  }
  if (branch === PROD_BRANCH && !V8_GRADUATED && majorOf(version) >= 8) {
    problems.push(
      `${label} is ${version}; 8.x cannot publish from \`${PROD_BRANCH}\` until v8 graduates (V8_GRADUATED).`
    );
  }
  return problems;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--package') args.package = true;
    else if (arg === '--channel') args.channel = argv[++i];
    else if (arg === '--group') args.group = argv[++i];
    else fail([`Unknown argument: ${arg}`]);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

if (args.package && process.env.GITHUB_ACTIONS === 'true') {
  console.log('Publish target check skipped: CI runs dry-run publishes only (see header).');
  process.exit(0);
}

const branch = currentBranch();

if (!branch || branch === 'HEAD') {
  fail(['Could not resolve the current git branch (detached HEAD or not a git checkout).']);
}

if (args.package) {
  const manifest = readManifest(process.cwd());
  const group = Object.keys(GROUPS).find((g) =>
    GROUPS[g].some((dir) => readManifest(path.join(repoRoot, 'packages', dir)).name === manifest.name)
  );
  const problems = [];

  if (branch !== PROD_BRANCH && branch !== BETA_BRANCH) {
    problems.push(
      `${manifest.name} is being published from \`${branch}\`; only \`${PROD_BRANCH}\` (prod) and \`${BETA_BRANCH}\` (beta) may publish.`
    );
  }
  if (branch === PROD_BRANCH && isPrerelease(manifest.version)) {
    problems.push(
      `${manifest.name} is ${manifest.version}; a prerelease cannot publish from \`${PROD_BRANCH}\` — beta publishes from \`${BETA_BRANCH}\`.`
    );
  }
  problems.push(
    ...versionShapeProblems(branch, manifest.name, manifest.version, API_GROUPS.has(group))
  );

  if (problems.length > 0) fail(problems);
  console.log(`Publish target OK: ${manifest.name}@${manifest.version} from \`${branch}\`.`);
  process.exit(0);
}

const { channel, group } = args;
if (channel !== 'prod' && channel !== 'beta') {
  fail([`--channel must be "prod" or "beta" (got ${JSON.stringify(channel)}).`]);
}
if (!GROUPS[group]) {
  fail([`--group must be one of ${Object.keys(GROUPS).join(', ')} (got ${JSON.stringify(group)}).`]);
}

const packages = GROUPS[group].map((dir) => {
  const manifest = readManifest(path.join(repoRoot, 'packages', dir));
  return { name: manifest.name, version: manifest.version };
});
const problems = [];

// Rule 2
const versions = new Set(packages.map((p) => p.version));
if (versions.size > 1) {
  problems.push(
    `The ${group} group's versions disagree: ${packages.map((p) => `${p.name}@${p.version}`).join(', ')}.`
  );
}

// Rules 3 and 4
const allowedBranch = channel === 'prod' ? PROD_BRANCH : BETA_BRANCH;
if (branch !== allowedBranch) {
  problems.push(`${channel} publishes from \`${allowedBranch}\` only; current branch is \`${branch}\`.`);
}

for (const pkg of packages) {
  // Rule 5
  if (channel === 'prod' && isPrerelease(pkg.version)) {
    problems.push(`${pkg.name} is ${pkg.version}; a prerelease cannot publish to prod (latest).`);
  }
  // Rules 6 and 7
  problems.push(...versionShapeProblems(branch, pkg.name, pkg.version, API_GROUPS.has(group)));
}

if (problems.length > 0) fail(problems);
console.log(
  `Publish target OK: ${channel} for ${group} (${[...versions].join(', ')}) from \`${branch}\`.`
);
