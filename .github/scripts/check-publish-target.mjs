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
//       Run first in every root publish script, before any build or version
//       bump. Checks the whole group, including that its packages agree on
//       one version.
//
//   --package
//       Run from each package's own `prepublishOnly`, with the package
//       directory as cwd. npm and pnpm fire that hook before any publish, so
//       this catches a bare `pnpm --filter <pkg> publish` that bypasses the
//       root scripts. The hook cannot see the dist-tag being published to, so
//       the root scripts state it: their publish command runs with
//       SUBLAY_PUBLISH_CHANNEL=prod|beta, and this mode refuses any publish
//       that arrives without it. That matters most under pnpm, which — unlike
//       npm — publishes a prerelease with no `--tag` straight to `latest`.
//
//       Skipped entirely inside GitHub Actions. Every workflow runs
//       `pnpm publish --dry-run` as a test step, `prepublishOnly` fires during
//       a dry-run, and pnpm 11 exposes no dry-run signal to the hook (no
//       npm_config_dry_run) — while a pull_request checkout is a detached
//       merge commit, so this mode would refuse and redden every PR. Skipping
//       is safe only because nothing in CI publishes for real. If a workflow
//       ever starts publishing, this skip has to be revisited.
//
//       A consequence for local use: a hand-run `pnpm publish --dry-run` is
//       refused, since it carries no channel. To rehearse exactly what CI
//       runs, prefix it with GITHUB_ACTIONS=true (`--ignore-scripts` also
//       works, but skips the build and every lifecycle hook, so it only packs
//       whatever is already in dist/).
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
//      (`npm version patch|minor` on 8.0.0-beta.0 yields 8.0.0.)
//   7. On `main`, the API groups must not be 8.x until V8_GRADUATED is flipped.
//      That constant is the whole graduation switch for this file.
//   8. Every version must be plain semver (`8.0.0-beta.1`, not `v8.0.0`), and
//      every package must belong to a known group — an unknown one refuses
//      rather than silently skipping rules 6 and 7.
//   9. Only the API groups have a beta channel. cli and ui-core have no
//      @sublay/* dependencies, are not tied to the API version, stay on 7.x,
//      and publish to prod from `main` only. (A beta of theirs from `v8` would
//      also take a plain 7.x number that `main`'s next release then reuses —
//      and pnpm silently skips a version already on the registry.) Rules 6 and
//      7 do not apply to them.
//  10. The local branch must not be behind GitHub. The gate runs
//      `git fetch origin <branch>` and refuses if the fetch fails (publishing
//      needs the network anyway) or if `origin/<branch>` has commits HEAD
//      lacks — otherwise a stale local `main` publishes a release missing
//      already-merged work, with no error. Being ahead is fine: that is the
//      unpushed release-bump commit. There is deliberately no clean-tree
//      check — the release flow bumps versions before publishing and commits
//      the bump afterwards. Root-script mode only: --package mode can only be
//      reached through the root scripts, which have already run it.
//      It runs once per release command, before any version bump: the
//      `:patch`/`:minor`/`:prerelease` composites run this gate, bump, then call
//      the bare publish script with SUBLAY_PUBLISH_FRESHNESS_CHECKED=1, whose
//      own gate then skips the fetch — otherwise a network blip between the
//      two runs would refuse *after* the bump and leave bumped manifests
//      behind. It also only fetches when every other rule has passed, and
//      gives up after 30 seconds.
//
// Node built-ins only, so it can run before (or without) an install.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const V8_GRADUATED = false;

const BRANCH_FOR_CHANNEL = { prod: 'main', beta: 'v8' };
const CHANNEL_ENV = 'SUBLAY_PUBLISH_CHANNEL';

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

// Strict semver: MAJOR.MINOR.PATCH, optional -prerelease, optional +build.
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function fail(problems) {
  console.error(`\nPublish refused — ${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    `\nProduction publishes from \`${BRANCH_FOR_CHANNEL.prod}\` only; beta publishes from \`${BRANCH_FOR_CHANNEL.beta}\` only,\n` +
      'both through the root `{group}:publish-*` scripts. See plan-v8-beta.md §5.4 at the engine root.'
  );
  process.exit(1);
}

// `--show-current` rather than `rev-parse --abbrev-ref HEAD`: the latter
// answers `heads/v8` when a tag named `v8` also exists.
function currentBranch() {
  try {
    return execFileSync('git', ['branch', '--show-current'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

// Rule 10. Only meaningful once the branch is the right one for the channel.
function freshnessProblems(branch) {
  try {
    execFileSync('git', ['fetch', '--quiet', 'origin', branch], {
      cwd: repoRoot,
      stdio: ['ignore', 'ignore', 'pipe'],
      timeout: 30_000,
    });
  } catch {
    return [`Could not fetch \`origin/${branch}\` to confirm the local branch is up to date (offline, or the branch is not on GitHub).`];
  }
  const behind = Number(
    execFileSync('git', ['rev-list', '--count', 'HEAD..FETCH_HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim()
  );
  return behind > 0
    ? [`Local \`${branch}\` is ${behind} commit(s) behind GitHub — pull first, or the release will be missing merged work.`]
    : [];
}

function readManifest(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
}

function groupOfPackage(name) {
  return Object.keys(GROUPS).find((group) =>
    GROUPS[group].some((dir) => readManifest(path.join(repoRoot, 'packages', dir)).name === name)
  );
}

// Rule 9.
function channelProblems(channel, group) {
  return channel === 'beta' && !API_GROUPS.has(group)
    ? [`${group} has no beta channel; it publishes to prod from \`${BRANCH_FOR_CHANNEL.prod}\` only.`]
    : [];
}

// Rules 3/4: one problem per publish, not one per package.
function branchProblems(channel, branch) {
  const allowed = BRANCH_FOR_CHANNEL[channel];
  return branch === allowed
    ? []
    : [`${channel} publishes from \`${allowed}\` only; current branch is \`${branch}\`.`];
}

// Rules 5–8 for a single package.
function packageProblems(channel, branch, group, name, version) {
  const parsed = SEMVER.exec(version);
  if (!parsed) return [`${name} has version ${JSON.stringify(version)}, which is not plain semver (e.g. 8.0.0-beta.1).`];

  const major = Number(parsed[1]);
  const prerelease = parsed[4] !== undefined;
  const problems = [];

  if (channel === 'prod' && prerelease) {
    problems.push(`${name} is ${version}; a prerelease cannot publish to prod (latest).`);
  }
  if (API_GROUPS.has(group)) {
    if (branch === BRANCH_FOR_CHANNEL.beta && !(major === 8 && prerelease)) {
      problems.push(`${name} is ${version}; on \`${branch}\` it must be an 8.x prerelease (e.g. 8.0.0-beta.1).`);
    }
    if (branch === BRANCH_FOR_CHANNEL.prod && !V8_GRADUATED && major >= 8) {
      problems.push(`${name} is ${version}; 8.x cannot publish from \`${branch}\` until v8 graduates (V8_GRADUATED).`);
    }
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
if (!branch) {
  fail(['Could not resolve the current git branch (detached HEAD or not a git checkout).']);
}

if (args.package) {
  const { name, version } = readManifest(process.cwd());
  const channel = process.env[CHANNEL_ENV];
  const group = groupOfPackage(name);

  if (channel === undefined || channel === '') {
    fail([
      `${name} is being published without ${CHANNEL_ENV}. Publish through a root \`{group}:publish-*\` script, ` +
        'which sets it — a bare `pnpm publish` of a prerelease goes straight to `latest`.',
    ]);
  }
  if (channel !== 'prod' && channel !== 'beta') {
    fail([`${CHANNEL_ENV} must be "prod" or "beta" (got ${JSON.stringify(channel)}).`]);
  }
  if (!group) fail([`${name} is not in any publish group in check-publish-target.mjs.`]);

  const problems = [
    ...channelProblems(channel, group),
    ...branchProblems(channel, branch),
    ...packageProblems(channel, branch, group, name, version),
  ];
  if (problems.length > 0) fail(problems);
  console.log(`Publish target OK: ${channel} for ${name}@${version} from \`${branch}\`.`);
  process.exit(0);
}

const { channel, group } = args;
if (channel !== 'prod' && channel !== 'beta') {
  fail([`--channel must be "prod" or "beta" (got ${JSON.stringify(channel)}).`]);
}
if (!GROUPS[group]) {
  fail([`--group must be one of ${Object.keys(GROUPS).join(', ')} (got ${JSON.stringify(group)}).`]);
}

const packages = GROUPS[group].map((dir) => readManifest(path.join(repoRoot, 'packages', dir)));
const problems = [...channelProblems(channel, group), ...branchProblems(channel, branch)];

// Rule 2
const versions = new Set(packages.map((p) => p.version));
if (versions.size > 1) {
  problems.push(
    `The ${group} group's versions disagree: ${packages.map((p) => `${p.name}@${p.version}`).join(', ')}.`
  );
}

for (const pkg of packages) {
  problems.push(...packageProblems(channel, branch, group, pkg.name, pkg.version));
}

// Rule 10 — only once everything else has passed (so a refusal for any other
// reason never touches the network), and skipped by the inner gate of a
// composite that already ran it before bumping.
if (problems.length === 0 && process.env.SUBLAY_PUBLISH_FRESHNESS_CHECKED !== '1') {
  problems.push(...freshnessProblems(branch));
}

if (problems.length > 0) fail(problems);
console.log(`Publish target OK: ${channel} for ${group} (${[...versions].join(', ')}) from \`${branch}\`.`);
