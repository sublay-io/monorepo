#!/usr/bin/env node
// Registry integrity check for the cli group (see .github/workflows/cli.yml).
//
// The registry is served straight off this repo's default branch — no version
// gate, no publish step — so a broken registry/**/registry.json reaches every
// `sublay add` user the moment it merges. Building @sublay/cli proves nothing
// about it: the CLI reads this metadata at runtime.
//
// Seven invariants are enforced here, all of which fail at runtime rather than
// build time and are therefore invisible to every other step in the job:
//
//   1. registryUrl points at the component's own directory under
//      REMOTE_REGISTRY_BASE. The CLI builds its download URLs from the ref
//      plus platform/component/style rather than from this field, so it is an
//      identity field: it has to name the directory the manifest sits in.
//   2. exports.mainComponent is a non-empty string. `sublay add` writes it
//      verbatim into the generated barrel's export statement.
//   3. Every files[].path resolves to a real file next to the registry.json
//      that lists it — the local dev path reads these off disk and the remote
//      path fetches the same relative path from GitHub.
//   4. exports.mainFile names a file that files[] actually installs. The
//      generated barrel imports './components/<mainFile>' — an extension-less
//      path that only resolves because some files[] entry put
//      'files/<mainFile>.<ext>' there (add.ts strips the 'files/' prefix and
//      re-roots the rest under 'components/'). A typo here ships a barrel
//      that cannot resolve, to every user of that component.
//   5. REMOTE_REGISTRY_BASE names the same org/repo as @sublay/cli's own
//      package.json `repository.url`. Those are the only two places in the
//      repo that hardcode where this code lives, they are edited by different
//      people for different reasons (a URL constant vs. npm page metadata),
//      and invariants 1-4 are all self-consistent under a wrong repo — an org
//      rename that updates one and not the other passes every other check
//      here while every `sublay add` 404s.
//   6. REMOTE_REGISTRY_BASE's ref segment is literally `main`. Invariant 5
//      only compares org/repo and throws the ref away, so a rewrite of `main`
//      to any other branch name — applied consistently across registry.ts and
//      all nine registry.json files, which is exactly what a careless
//      find-and-replace produces — stays internally consistent and passes
//      every check above. It would also break the served URL for every user:
//      a plain `sublay add` reads the default ref with no version gate, so a
//      base pointing at a feature branch either 404s or silently serves
//      unreviewed component source to everyone who did not ask for a branch.
//      (`sublay add --ref <branch>` reads another branch on request; the base
//      for it is derived from this literal, which stays at `main`.)
//
//   7. Every name in exports.typeExports is really exported by the main file.
//      `sublay add` prints a usage snippet that imports the first of them
//      next to the main component (`import { X, type Y } from ...`), and the
//      generated barrel re-exports the main file with `export *` — so a name
//      the main file does not export is an import that fails to compile
//      (TS2305) in the very first thing the CLI tells the user to paste.
//
// Shared pieces (registry/shared/<platform>/shared.json) add a second set of
// rules, numbered S1-S6 where they are enforced below. A component manifest
// may list shared pieces under `shared`; `sublay add` copies them, and
// everything they require, into the component's own shared/ folder and
// rewrites `~shared/<platform>/<piece>` imports to relative paths. Each rule
// is something that otherwise only fails in a user's build:
//
//   S1. Each platform's shared.json is valid: `platform` is the folder name
//       and every piece has `files`, `requires` and `dependencies` of the
//       right shape.
//   S2. Every file a piece lists exists, and one of them is named after the
//       piece (`<piece>.tsx|ts|jsx|js`) — that is the file the rewritten
//       import resolves to.
//   S3. Every `requires` entry names a piece in the same manifest, and the
//       requirements have no cycle.
//   S4. No shared file imports the `~shared/` alias or a path outside its own
//       folder, and every relative import of another piece's file is mirrored
//       in `requires` — shared files are installed side by side, with no
//       import rewriting between them.
//   S5. Every name in a component manifest's `shared` list is a piece in that
//       platform's shared.json.
//   S6. Every `~shared/<platform>/<piece>` import in a component's files is
//       covered by the transitive closure of its manifest's `shared` list.
//
// The shared manifest is deliberately not named registry.json, and the walk
// for component manifests skips registry/shared/.
//
// One more check runs only on a push to main in CI: it actually fetches one
// real registry.json over the network and requires a 200. Everything above is
// internal consistency; only main is actually served to users, and only there
// is a live URL meaningful (on this branch, before merge, the raw URL 404s by
// definition because registry/ does not exist on main yet). It is skipped
// entirely for local and pull_request runs so it can never fail spuriously.
//
// Node built-ins only, so it can run before (or without) an install.
//
// SUBLAY_REGISTRY_ROOT points the check at another registry directory. It is
// for this script's own tests (check-registry-integrity.test.mjs), which run
// it against fixture registries; the live reachability check is skipped then.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..');
const registryRootOverride = process.env.SUBLAY_REGISTRY_ROOT;
const registryRoot = registryRootOverride
  ? path.resolve(registryRootOverride)
  : path.join(repoRoot, 'registry');
// What reported paths are relative to: the repo, or the fixture's parent.
const displayRoot = registryRootOverride ? path.dirname(registryRoot) : repoRoot;
const registrySourceFile = path.join(
  repoRoot,
  'packages',
  'cli',
  'src',
  'utils',
  'registry.ts'
);
const cliPackageFile = path.join(repoRoot, 'packages', 'cli', 'package.json');

// Extensions a mainFile may resolve through. Mirrors what the registry
// actually ships and what a bundler would resolve for an extension-less
// './components/<mainFile>' import.
const MAIN_FILE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

/**
 * Read REMOTE_REGISTRY_BASE out of the CLI source rather than duplicating it.
 *
 * The CLI downloads a component's manifest and files from
 * REMOTE_REGISTRY_BASE (or the same base with another ref, for `--ref`), and
 * every registry.json records the matching URL of its own directory in
 * registryUrl. The two have to name the same repo, so the check has to compare
 * the JSON against the constant that actually ships — a hardcoded copy here
 * would happily agree with the JSON while both disagreed with the CLI (an org
 * rename being the obvious way in).
 *
 * A regex is enough: this is a build-time check, not production code, and the
 * constant is a plain string literal. If it ever stops being one, this throws
 * rather than silently falling back to a guess.
 */
function readRemoteRegistryBase() {
  let source;
  try {
    source = fs.readFileSync(registrySourceFile, 'utf8');
  } catch (err) {
    console.error(
      `Registry integrity check: cannot read ${path.relative(
        repoRoot,
        registrySourceFile
      )} (${err.message}). This script reads REMOTE_REGISTRY_BASE from there ` +
        'rather than keeping its own copy.'
    );
    process.exit(1);
  }

  const match = source.match(
    /const\s+REMOTE_REGISTRY_BASE\s*=\s*(['"`])([^'"`]+)\1/
  );
  if (!match) {
    console.error(
      'Registry integrity check: could not find a `const REMOTE_REGISTRY_BASE = "<url>"` ' +
        `string literal in ${path.relative(repoRoot, registrySourceFile)}. ` +
        'Either it was renamed or it is no longer a plain literal — update ' +
        'this script to match, do not re-hardcode the URL here.'
    );
    process.exit(1);
  }

  return match[2].replace(/\/+$/, '');
}

const REMOTE_REGISTRY_BASE = readRemoteRegistryBase();

/**
 * Pull "<org>/<repo>" out of any GitHub URL we care about.
 *
 * Handles both shapes in play here:
 *   https://raw.githubusercontent.com/<org>/<repo>/<ref>/<path...>
 *   https://github.com/<org>/<repo>.git   (also git+https://, git://, ssh)
 *
 * Returns null rather than guessing if it does not look like GitHub at all —
 * the caller turns that into a hard failure, because a non-GitHub value in
 * either place means the assumption this whole check rests on (the registry
 * is served off raw.githubusercontent.com from the repo that ships the CLI)
 * has stopped holding.
 */
function parseGitHubSlug(url) {
  if (typeof url !== 'string') return null;

  const normalized = url
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\/git@/, 'https://')
    .replace(/^git@([^:]+):/, 'https://$1/');

  const match = normalized.match(
    /^https?:\/\/(?:raw\.githubusercontent\.com|github\.com)\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/
  );
  if (!match) return null;

  // GitHub org and repo names are case-insensitive; compare them that way so
  // a capitalisation difference is not reported as drift.
  return `${match[1].toLowerCase()}/${match[2].toLowerCase()}`;
}

/**
 * Invariant 5: the CLI's registry URL and the CLI's own published
 * `repository.url` must name the same GitHub repo.
 */
function assertRegistryBaseMatchesCliRepository() {
  let cliPackage;
  try {
    cliPackage = JSON.parse(fs.readFileSync(cliPackageFile, 'utf8'));
  } catch (err) {
    console.error(
      `Registry integrity check: cannot read ${path.relative(
        repoRoot,
        cliPackageFile
      )} (${err.message}). This script cross-checks REMOTE_REGISTRY_BASE ` +
        'against that file\'s repository.url.'
    );
    process.exit(1);
  }

  const repositoryUrl =
    cliPackage.repository && typeof cliPackage.repository === 'object'
      ? cliPackage.repository.url
      : cliPackage.repository;

  const packageSlug = parseGitHubSlug(repositoryUrl);
  const registrySlug = parseGitHubSlug(REMOTE_REGISTRY_BASE);

  if (packageSlug === null) {
    console.error(
      'Registry integrity check: could not read a GitHub "<org>/<repo>" out ' +
        `of ${path.relative(repoRoot, cliPackageFile)}'s repository.url ` +
        `(${JSON.stringify(repositoryUrl)}).`
    );
    process.exit(1);
  }

  if (registrySlug === null) {
    console.error(
      'Registry integrity check: could not read a GitHub "<org>/<repo>" out ' +
        `of REMOTE_REGISTRY_BASE (${JSON.stringify(REMOTE_REGISTRY_BASE)}) in ` +
        `${path.relative(repoRoot, registrySourceFile)}. The registry is ` +
        'expected to be served from raw.githubusercontent.com.'
    );
    process.exit(1);
  }

  if (packageSlug !== registrySlug) {
    console.error(
      'Registry integrity check FAILED: the CLI downloads the registry from ' +
        'one repo but publishes itself as living in another.\n\n' +
        `  REMOTE_REGISTRY_BASE (${path.relative(
          repoRoot,
          registrySourceFile
        )}): ${registrySlug}\n` +
        `  repository.url (${path.relative(
          repoRoot,
          cliPackageFile
        )}):        ${packageSlug}\n\n` +
        'These are the only two places that hardcode where this code lives. ' +
        'If the repo moved, both have to move — every registry.json is ' +
        'self-consistent with a wrong base, so nothing else here catches it, ' +
        'and `sublay add` 404s for every user.'
    );
    process.exit(1);
  }

  return packageSlug;
}

const REPO_SLUG = assertRegistryBaseMatchesCliRepository();

// The branch the registry is served from by default. Not configurable on
// purpose: the CLI has no version gate, so whatever ref this URL names is what
// every `sublay add` without `--ref`, on every published CLI version,
// downloads. That has to be the repo's default branch. `--ref <branch>` is a
// per-command choice and derives its base from this one.
const EXPECTED_REGISTRY_REF = 'main';

/**
 * Invariant 6: REMOTE_REGISTRY_BASE must be served off `main`.
 *
 * Invariant 5 compares only "<org>/<repo>" and discards everything after it,
 * so it is blind to the ref. A consistent rename of `main` across
 * registry.ts and every registry.json keeps invariants 1-5 all green while
 * pointing the whole registry at a branch users' CLIs will never be able to
 * read from (or, worse, one that resolves and serves unreviewed source).
 */
function assertRegistryBaseUsesDefaultBranch() {
  const match = REMOTE_REGISTRY_BASE.match(
    /^https?:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/([^/]+)(?:\/|$)/
  );

  if (!match) {
    console.error(
      'Registry integrity check FAILED: could not read a ref segment out of ' +
        `REMOTE_REGISTRY_BASE (${JSON.stringify(REMOTE_REGISTRY_BASE)}) in ` +
        `${path.relative(repoRoot, registrySourceFile)}. It is expected to ` +
        'look like https://raw.githubusercontent.com/<org>/<repo>/' +
        `${EXPECTED_REGISTRY_REF}/<path...>.`
    );
    process.exit(1);
  }

  const ref = match[1];
  if (ref !== EXPECTED_REGISTRY_REF) {
    console.error(
      'Registry integrity check FAILED: the registry base points at a ref ' +
        'other than the default branch.\n\n' +
        `  REMOTE_REGISTRY_BASE (${path.relative(
          repoRoot,
          registrySourceFile
        )}): ${REMOTE_REGISTRY_BASE}\n` +
        `  ref segment: ${ref}\n` +
        `  expected:    ${EXPECTED_REGISTRY_REF}\n\n` +
        'The CLI fetches the registry off this ref with no version gate ' +
        'whenever `sublay add` is run without `--ref`, so every published CLI ' +
        'version reads whatever this names by default. Every registry.json is self-consistent ' +
        'with a wrong ref — the org/repo cross-check above discards the ref ' +
        'entirely — so nothing else here catches it, and `sublay add` breaks ' +
        'for every user.'
    );
    process.exit(1);
  }

  return ref;
}

const REGISTRY_REF = assertRegistryBaseUsesDefaultBranch();

const sharedRoot = path.join(registryRoot, 'shared');

/**
 * Recursively collect every registry.json under registry/, skipping
 * node_modules and registry/shared/ (shared pieces are described by
 * shared.json, not by component manifests).
 */
function findRegistryFiles(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (full === sharedRoot) continue;
    if (entry.isDirectory()) {
      found.push(...findRegistryFiles(full));
    } else if (entry.name === 'registry.json') {
      found.push(full);
    }
  }
  return found;
}

const errors = [];
/** @param {string} file @param {string} message */
function fail(file, message) {
  errors.push(`${path.relative(displayRoot, file)}: ${message}`);
}

if (!fs.existsSync(registryRoot)) {
  console.error(`Registry integrity check: ${registryRoot} does not exist.`);
  process.exit(1);
}

const registryFiles = findRegistryFiles(registryRoot).sort();

// A zero-result walk means the layout moved and this check silently stopped
// covering anything — treat it as a failure, not a pass.
if (registryFiles.length === 0) {
  console.error(
    'Registry integrity check: no registry/**/registry.json files found. ' +
      'Either the registry moved or this script is looking in the wrong place.'
  );
  process.exit(1);
}

/**
 * Whether `source` exports `name` — as a declaration
 * (`export type|interface|enum|class|function|const X`) or in an export list
 * (`export { X }`, `export type { X }`, `export { Y as X }`).
 *
 * A regex is enough here for the same reason as above: this is a build-time
 * check over our own files. Comments are stripped first so a commented-out
 * export does not count.
 */
function sourceExportsName(source, name) {
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const declaration = new RegExp(
    `\\bexport\\s+(?:declare\\s+)?(?:abstract\\s+)?` +
      `(?:type|interface|enum|class|function|const|let|var)\\s+${escaped}\\b`
  );
  if (declaration.test(code)) return true;

  for (const list of code.matchAll(/\bexport\s+(?:type\s+)?\{([^}]*)\}/g)) {
    const exported = list[1].split(',').map((part) => {
      const pieces = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/);
      return pieces[pieces.length - 1].trim();
    });
    if (exported.includes(name)) return true;
  }

  return false;
}

let checkedFileEntries = 0;
let checkedMainFiles = 0;
let checkedTypeExports = 0;
/** @type {{registryUrl: string, mainFilePath: string}[]} */
const remoteProbes = [];
// Collected for the shared-piece rules, which run after this loop.
/** @type {{registryFile: string, dir: string, platform: string, shared: unknown, filePaths: string[]}[]} */
const componentVariants = [];

for (const registryFile of registryFiles) {
  const dir = path.dirname(registryFile);

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
  } catch (err) {
    fail(registryFile, `is not valid JSON (${err.message})`);
    continue;
  }

  // 1. registryUrl must name this component's own directory.
  const relativeDir = path.relative(registryRoot, dir).split(path.sep).join('/');
  const expectedUrl = `${REMOTE_REGISTRY_BASE}/${relativeDir}`;
  if (manifest.registryUrl !== expectedUrl) {
    fail(
      registryFile,
      `registryUrl mismatch\n    expected: ${expectedUrl}\n    actual:   ${
        manifest.registryUrl === undefined
          ? '(missing)'
          : JSON.stringify(manifest.registryUrl)
      }`
    );
  }

  // 2. exports.mainComponent must be a usable identifier for the barrel.
  const exportsBlock =
    manifest.exports && typeof manifest.exports === 'object'
      ? manifest.exports
      : undefined;
  if (!exportsBlock) {
    fail(
      registryFile,
      `"exports" must be an object, got ${
        manifest.exports === undefined ? '(missing)' : typeof manifest.exports
      }`
    );
  } else if (
    typeof exportsBlock.mainComponent !== 'string' ||
    exportsBlock.mainComponent.trim().length === 0
  ) {
    fail(
      registryFile,
      `exports.mainComponent must be a non-empty string, got ${
        exportsBlock.mainComponent === undefined
          ? '(missing)'
          : JSON.stringify(exportsBlock.mainComponent)
      }`
    );
  }

  // 3. Every files[].path must resolve to a real file in this directory.
  //    (Also feeds invariant 4 below, which needs the file list.)
  if (!Array.isArray(manifest.files)) {
    fail(
      registryFile,
      `"files" must be an array, got ${
        manifest.files === undefined ? '(missing)' : typeof manifest.files
      }`
    );
    continue;
  }

  manifest.files.forEach((entry, index) => {
    if (!entry || typeof entry.path !== 'string' || entry.path.length === 0) {
      fail(registryFile, `files[${index}] has no usable "path" string`);
      return;
    }
    checkedFileEntries += 1;
    const target = path.join(dir, entry.path);
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      fail(
        registryFile,
        `files[${index}].path "${entry.path}" does not resolve to a file ` +
          `(looked for ${path.relative(displayRoot, target)})`
      );
    }
  });

  componentVariants.push({
    registryFile,
    dir,
    platform: relativeDir.split('/')[0],
    shared: manifest.shared,
    filePaths: manifest.files
      .filter((entry) => entry && typeof entry.path === 'string')
      .map((entry) => entry.path),
  });

  // 4. exports.mainFile must name one of those files[] entries.
  if (exportsBlock) {
    const { mainFile } = exportsBlock;
    if (typeof mainFile !== 'string' || mainFile.trim().length === 0) {
      fail(
        registryFile,
        `exports.mainFile must be a non-empty string, got ${
          mainFile === undefined ? '(missing)' : JSON.stringify(mainFile)
        }`
      );
    } else {
      const candidates = MAIN_FILE_EXTENSIONS.map(
        (ext) => `files/${mainFile}${ext}`
      );
      const declaredPaths = new Set(
        manifest.files
          .filter((entry) => entry && typeof entry.path === 'string')
          .map((entry) => entry.path)
      );
      const matched = candidates.find((candidate) =>
        declaredPaths.has(candidate)
      );
      if (matched === undefined) {
        fail(
          registryFile,
          `exports.mainFile "${mainFile}" has no matching files[] entry\n` +
            `    looked for: ${candidates.join(', ')}\n` +
            '    `sublay add` generates a barrel importing ' +
            `'./components/${mainFile}', which only resolves if one of those ` +
            'is installed'
        );
      } else {
        checkedMainFiles += 1;
        // Remembered for the on-main network check below, which needs a real
        // files[] path to prove the registryUrl + path join actually
        // downloads — not just that the metadata is reachable.
        remoteProbes.push({
          registryUrl: manifest.registryUrl,
          mainFilePath: matched,
        });

        // 7. Every declared type export must exist in the main file.
        const { typeExports } = exportsBlock;
        if (typeExports !== undefined) {
          if (!Array.isArray(typeExports)) {
            fail(
              registryFile,
              `exports.typeExports must be an array of strings, got ${typeof typeExports}`
            );
          } else {
            const mainFileOnDisk = path.join(dir, matched);
            const mainSource = fs.existsSync(mainFileOnDisk)
              ? fs.readFileSync(mainFileOnDisk, 'utf8')
              : null;
            typeExports.forEach((typeName, index) => {
              if (typeof typeName !== 'string' || typeName.trim().length === 0) {
                fail(
                  registryFile,
                  `exports.typeExports[${index}] must be a non-empty string, got ${JSON.stringify(
                    typeName
                  )}`
                );
                return;
              }
              // A missing main file is already reported by invariant 3.
              if (mainSource === null) return;
              checkedTypeExports += 1;
              if (!sourceExportsName(mainSource, typeName)) {
                fail(
                  registryFile,
                  `exports.typeExports[${index}] "${typeName}" is not exported by ${matched}\n` +
                    '    `sublay add` prints `import { ' +
                    `${exportsBlock.mainComponent}, type ${typeName} }` +
                    '` as the usage snippet, which does not compile unless ' +
                    'the main file exports that name'
                );
              }
            });
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Shared pieces (rules S1-S6, described at the top of this file).
// ---------------------------------------------------------------------------

const PIECE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SOURCE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

// The specifier of every import in a source file, in the `from '...'`,
// side-effect `import '...'`, dynamic `import('...')` and `require('...')`
// forms. The same forms the CLI rewrites (packages/cli/src/utils/transform.ts).
const IMPORT_SPECIFIER = /\b(?:from|import|require)\s*\(?\s*(['"])([^'"\n]+)\1/g;
const SHARED_ALIAS_PREFIX = '~shared/';

/** @param {string} source @returns {string[]} */
function findImportSpecifiers(source) {
  return Array.from(source.matchAll(IMPORT_SPECIFIER), (match) => match[2]);
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** A registry dependency spec must carry a range: `name@range`. */
function isDependencySpec(spec) {
  return /^(?:@[^/@\s]+\/)?[^/@\s]+@\S+$/.test(spec);
}

/**
 * @typedef {{files: string[], requires: string[]}} Piece
 * @type {Map<string, {file: string, dir: string, pieces: Map<string, Piece>}>}
 */
const sharedManifests = new Map();
let checkedSharedPieces = 0;
let checkedSharedImports = 0;

if (fs.existsSync(sharedRoot)) {
  const platforms = fs
    .readdirSync(sharedRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'node_modules')
    .map((entry) => entry.name)
    .sort();

  for (const platform of platforms) {
    const sharedDir = path.join(sharedRoot, platform);
    const sharedFile = path.join(sharedDir, 'shared.json');

    // S1. The manifest exists and has the documented shape.
    if (!fs.existsSync(sharedFile)) {
      fail(sharedFile, 'is missing: every folder under registry/shared/ needs a shared.json');
      continue;
    }

    let sharedManifest;
    try {
      sharedManifest = JSON.parse(fs.readFileSync(sharedFile, 'utf8'));
    } catch (err) {
      fail(sharedFile, `is not valid JSON (${err.message})`);
      continue;
    }

    if (
      typeof sharedManifest !== 'object' ||
      sharedManifest === null ||
      Array.isArray(sharedManifest)
    ) {
      fail(sharedFile, 'must be an object with "platform" and "pieces"');
      continue;
    }

    if (sharedManifest.platform !== platform) {
      fail(
        sharedFile,
        `"platform" must be the folder name "${platform}", got ${
          sharedManifest.platform === undefined
            ? '(missing)'
            : JSON.stringify(sharedManifest.platform)
        }`
      );
    }

    const rawPieces = sharedManifest.pieces;
    if (typeof rawPieces !== 'object' || rawPieces === null || Array.isArray(rawPieces)) {
      fail(sharedFile, '"pieces" must be an object keyed by piece name');
      continue;
    }

    /** @type {Map<string, Piece>} */
    const pieces = new Map();
    sharedManifests.set(platform, { file: sharedFile, dir: sharedDir, pieces });

    for (const [name, piece] of Object.entries(rawPieces)) {
      checkedSharedPieces += 1;

      if (!PIECE_NAME.test(name)) {
        fail(sharedFile, `piece "${name}" must have a kebab-case name`);
      }

      if (typeof piece !== 'object' || piece === null || Array.isArray(piece)) {
        fail(sharedFile, `piece "${name}" must be an object`);
        continue;
      }

      const files = isStringArray(piece.files) ? piece.files : [];
      const requires = isStringArray(piece.requires) ? piece.requires : [];
      pieces.set(name, { files, requires });

      if (!isStringArray(piece.files) || piece.files.length === 0) {
        fail(sharedFile, `piece "${name}" must list at least one file in "files"`);
      }
      if (!isStringArray(piece.requires)) {
        fail(
          sharedFile,
          `piece "${name}" needs "requires": a list of piece names (empty when it requires none)`
        );
      }
      if (!isStringArray(piece.dependencies)) {
        fail(
          sharedFile,
          `piece "${name}" needs "dependencies": a list of packages as name@range (empty when it needs none)`
        );
      } else {
        for (const spec of piece.dependencies) {
          if (!isDependencySpec(spec)) {
            fail(
              sharedFile,
              `piece "${name}" has a dependency ${JSON.stringify(spec)} that is not of the form name@range`
            );
          }
        }
      }

      // S2. Every listed file exists, and one is named after the piece.
      for (const file of files) {
        const target = path.join(sharedDir, file);
        const inside = !path.relative(sharedDir, target).startsWith('..');
        if (!inside || path.isAbsolute(file)) {
          fail(sharedFile, `piece "${name}" lists "${file}", which is outside ${platform}'s shared folder`);
        } else if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
          fail(
            sharedFile,
            `piece "${name}" lists "${file}", which does not resolve to a file ` +
              `(looked for ${path.relative(displayRoot, target)})`
          );
        }
      }

      const ownFiles = SOURCE_EXTENSIONS.map((ext) => `${name}${ext}`);
      if (files.length > 0 && !files.some((file) => ownFiles.includes(file))) {
        fail(
          sharedFile,
          `piece "${name}" has no file named after it\n` +
            `    looked for: ${ownFiles.join(', ')}\n` +
            `    \`sublay add\` rewrites '~shared/${platform}/${name}' to a relative ` +
            `import of 'shared/${name}', which only resolves if one of those is installed`
        );
      }
    }

    // S3. Requirements name real pieces...
    for (const [name, piece] of pieces) {
      for (const requirement of piece.requires) {
        if (!pieces.has(requirement)) {
          fail(
            sharedFile,
            `piece "${name}" requires "${requirement}", which is not a piece in this manifest`
          );
        }
      }
    }

    // ...and have no cycle. Each cycle is reported once, from the first piece
    // (in manifest order) that reaches it.
    const state = new Map(); // name -> 'visiting' | 'done'
    const reportedCycles = new Set();
    const walk = (name, trail) => {
      if (state.get(name) === 'done') return;
      if (state.get(name) === 'visiting') {
        const cycle = trail.slice(trail.indexOf(name));
        const key = [...cycle].sort().join(' ');
        if (!reportedCycles.has(key)) {
          reportedCycles.add(key);
          fail(
            sharedFile,
            `requirement cycle between shared pieces: ${[...cycle, name].join(' -> ')}`
          );
        }
        return;
      }
      state.set(name, 'visiting');
      for (const requirement of pieces.get(name).requires) {
        if (pieces.has(requirement)) walk(requirement, [...trail, name]);
      }
      state.set(name, 'done');
    };
    for (const name of pieces.keys()) walk(name, []);

    // S4. What shared files import.
    /** @type {Map<string, string[]>} file (relative to sharedDir) -> owning pieces */
    const owners = new Map();
    for (const [name, piece] of pieces) {
      for (const file of piece.files) {
        const key = path.normalize(file);
        owners.set(key, [...(owners.get(key) ?? []), name]);
      }
    }

    const resolveSharedImport = (fromFile, specifier) => {
      const base = path.normalize(path.join(path.dirname(fromFile), specifier));
      const candidates = [
        base,
        ...SOURCE_EXTENSIONS.map((ext) => `${base}${ext}`),
        ...SOURCE_EXTENSIONS.map((ext) => path.join(base, `index${ext}`)),
      ];
      return { base, match: candidates.find((candidate) => owners.has(candidate)) };
    };

    for (const [name, piece] of pieces) {
      for (const file of piece.files) {
        const target = path.join(sharedDir, file);
        if (!fs.existsSync(target) || !fs.statSync(target).isFile()) continue;

        for (const specifier of findImportSpecifiers(fs.readFileSync(target, 'utf8'))) {
          if (specifier.startsWith(SHARED_ALIAS_PREFIX)) {
            fail(
              target,
              `imports "${specifier}": a shared file imports other pieces with a ` +
                "relative path ('./<piece>'), not the ~shared alias — the alias is " +
                'only rewritten in component files'
            );
            continue;
          }

          if (!specifier.startsWith('.')) continue;
          checkedSharedImports += 1;

          const { base, match } = resolveSharedImport(file, specifier);
          if (base.startsWith('..')) {
            fail(
              target,
              `imports "${specifier}", which is outside ${platform}'s shared folder — ` +
                'a shared file can only import packages and other shared files'
            );
            continue;
          }

          if (match === undefined) {
            fail(
              target,
              `imports "${specifier}", which is not a file of any piece in ${path.relative(
                displayRoot,
                sharedFile
              )} — it would not be installed`
            );
            continue;
          }

          const importedPieces = owners.get(match);
          if (importedPieces.includes(name)) continue;
          if (!importedPieces.some((owner) => piece.requires.includes(owner))) {
            fail(
              sharedFile,
              `piece "${name}" imports "${specifier}" in ${file} but does not list ` +
                `"${importedPieces[0]}" in "requires" — \`sublay add\` would not install it`
            );
          }
        }
      }
    }
  }
}

/** The pieces reached from `names` through `requires`, unknown names skipped. */
function sharedClosure(names, pieces) {
  const closure = new Set();
  const visit = (name) => {
    if (closure.has(name) || !pieces.has(name)) return;
    closure.add(name);
    pieces.get(name).requires.forEach(visit);
  };
  names.forEach(visit);
  return closure;
}

let checkedSharedLists = 0;

for (const variant of componentVariants) {
  const { registryFile, dir, platform, shared, filePaths } = variant;
  const platformShared = sharedManifests.get(platform);
  const sharedManifestLabel = `shared/${platform}/shared.json`;

  // S5. Every listed name is a piece of this platform.
  let listed = [];
  if (shared !== undefined) {
    if (!isStringArray(shared)) {
      fail(registryFile, '"shared" must be an array of shared piece names');
    } else {
      listed = shared;
      checkedSharedLists += 1;
      for (const name of shared) {
        if (!platformShared || !platformShared.pieces.has(name)) {
          fail(
            registryFile,
            `shared piece "${name}" is not defined in ${sharedManifestLabel}`
          );
        }
      }
    }
  }

  // S6. Every alias import in the variant's files is covered by that list.
  const covered = platformShared
    ? sharedClosure(listed, platformShared.pieces)
    : new Set();

  for (const filePath of filePaths) {
    const target = path.join(dir, filePath);
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) continue;

    for (const specifier of findImportSpecifiers(fs.readFileSync(target, 'utf8'))) {
      if (!specifier.startsWith(SHARED_ALIAS_PREFIX)) continue;
      checkedSharedImports += 1;

      const [aliasPlatform, ...rest] = specifier
        .slice(SHARED_ALIAS_PREFIX.length)
        .split('/');
      const piece = rest.join('/');

      if (aliasPlatform !== platform) {
        fail(
          registryFile,
          `${filePath} imports "${specifier}", a shared piece of another platform ` +
            `(this component is ${platform})`
        );
      } else if (!covered.has(piece)) {
        fail(
          registryFile,
          `${filePath} imports "${specifier}", but "${piece}" is not covered by this ` +
            `manifest's "shared" list (directly or through a listed piece's requirements ` +
            `in ${sharedManifestLabel}) — \`sublay add\` would not install it`
        );
      }
    }
  }
}

if (errors.length > 0) {
  console.error(
    `Registry integrity check FAILED with ${errors.length} problem(s):\n`
  );
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  console.error(
    '\nEvery registry.json must set registryUrl to its own directory under\n' +
      `${REMOTE_REGISTRY_BASE} (read from packages/cli/src/utils/registry.ts),\n` +
      'every files[].path must exist on disk relative to that registry.json,\n' +
      'exports.mainComponent/mainFile must name something files[] installs,\n' +
      'and every exports.typeExports name must be exported by the main file.\n' +
      'Shared pieces (registry/shared/<platform>/shared.json) must list files\n' +
      'that exist and requirements that resolve, and every ~shared/ import in a\n' +
      'component must be covered by its manifest\'s "shared" list.\n' +
      'The registry is served off the default branch, so these break\n' +
      '`sublay add` for every user as soon as they merge.'
  );
  process.exit(1);
}

console.log(
  `Registry integrity check passed: ${registryFiles.length} registry.json ` +
    `file(s), ${checkedFileEntries} file entr(ies), ${checkedMainFiles} ` +
    `main file(s), ${checkedTypeExports} type export(s) verified against REMOTE_REGISTRY_BASE ${REMOTE_REGISTRY_BASE} ` +
    `(repo ${REPO_SLUG}, cross-checked against packages/cli/package.json; ` +
    `ref ${REGISTRY_REF}). Shared pieces: ${sharedManifests.size} shared.json ` +
    `file(s), ${checkedSharedPieces} piece(s), ${checkedSharedLists} component ` +
    `"shared" list(s), ${checkedSharedImports} import(s) checked.`
);

// ---------------------------------------------------------------------------
// Live reachability — only on a push to main in CI.
//
// Everything above is internal consistency: it proves the metadata agrees with
// the files on disk and with the CLI source. It cannot prove the URLs actually
// serve anything, because REMOTE_REGISTRY_BASE points at main and only main is
// ever served. Running this anywhere else would fail for reasons that are not
// defects: on a feature branch the registry may not exist on main yet (it does
// not, until the consolidation branch merges), a PR's changes are by
// definition not on main, and local runs may have no network at all.
//
// So: skipped unless GitHub Actions says this is a push build of main. Those
// three variables are standard GitHub Actions defaults, set on every run.
// ---------------------------------------------------------------------------

const isCI = process.env.GITHUB_ACTIONS === 'true';
const isPushToMain =
  process.env.GITHUB_EVENT_NAME === 'push' &&
  process.env.GITHUB_REF === 'refs/heads/main';

if (registryRootOverride) {
  console.log(
    'Skipping live registry reachability check (SUBLAY_REGISTRY_ROOT is set; ' +
      'a fixture registry is not served from anywhere).'
  );
} else if (!isCI || !isPushToMain) {
  console.log(
    'Skipping live registry reachability check (runs only on a GitHub Actions ' +
      'push build of main; the registry is served from main, so the URLs are ' +
      'not expected to resolve from anywhere else).'
  );
} else {
  // One metadata URL and one component-file URL. The first proves
  // fetchRegistry() can find a component; the second proves fetchFile()'s
  // registryUrl + files[].path join resolves to a real download. Checking one
  // of each is the point — a base URL that serves registry.json but not the
  // files beside it is the failure shape a single probe would miss.
  const probe = remoteProbes[0];
  const targets = [
    { label: 'registry metadata', url: `${probe.registryUrl}/registry.json` },
    {
      label: 'component file',
      url: `${probe.registryUrl}/${probe.mainFilePath}`,
    },
  ];

  // Retried, because this job's most common trigger is the push that just
  // merged the change — and raw.githubusercontent.com is CDN-fronted, so it
  // can briefly still serve the pre-merge state (a 404 for a newly added
  // path). Without a retry this check's whole purpose would make it flaky on
  // exactly the runs it exists for. Three attempts over ~30s is well past
  // that window; a genuinely wrong URL stays wrong through all of them.
  const ATTEMPTS = 3;
  const RETRY_DELAY_MS = 15_000;
  const failures = [];

  for (const target of targets) {
    let lastProblem;

    for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
      if (attempt > 1) {
        console.log(
          `  retrying in ${RETRY_DELAY_MS / 1000}s (attempt ${attempt}/${ATTEMPTS}): ${target.url}`
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }

      let response;
      try {
        response = await fetch(target.url, {
          method: 'GET',
          redirect: 'follow',
          cache: 'no-store',
          signal: AbortSignal.timeout(20_000),
        });
      } catch (err) {
        lastProblem = `request failed: ${err.message}`;
        continue;
      }

      if (!response.ok) {
        lastProblem = `HTTP ${response.status} ${response.statusText}`;
        continue;
      }

      // Drain the body so the socket closes cleanly rather than leaving the
      // process holding an unconsumed stream.
      await response.arrayBuffer();
      console.log(`  reachable (${response.status}): ${target.url}`);
      lastProblem = undefined;
      break;
    }

    if (lastProblem !== undefined) {
      failures.push(
        `${target.label} ${target.url} — ${lastProblem} (after ${ATTEMPTS} attempts)`
      );
    }
  }

  if (failures.length > 0) {
    console.error(
      `\nLive registry reachability check FAILED with ${failures.length} problem(s):\n`
    );
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    console.error(
      '\nThese URLs are what `sublay add` fetches at runtime. main is now\n' +
        'serving a registry that a published CLI cannot download from.'
    );
    process.exit(1);
  }

  console.log('Live registry reachability check passed.');
}
