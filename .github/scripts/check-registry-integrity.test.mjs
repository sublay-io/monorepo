// Tests for check-registry-integrity.mjs, run with Node's built-in runner:
//
//   node --test .github/scripts/check-registry-integrity.test.mjs
//
// No dependencies: this runs before `pnpm install` in .github/workflows/cli.yml
// and .github/scripts is not a workspace package.
//
// The script runs at top level and exits the process, so each case writes a
// fixture registry to a temp directory, points the script at it with
// SUBLAY_REGISTRY_ROOT, runs it as a child process, and reads the exit code
// and output. Fixtures are built from one valid registry (`validRegistry`)
// with a small change per case, so each case shows exactly what it breaks.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(scriptDir, 'check-registry-integrity.mjs');
const repoRoot = path.resolve(scriptDir, '..', '..');

// The script checks every registryUrl against the base the CLI ships, so the
// fixtures have to use that base too. Read it the way the script does.
const REMOTE_REGISTRY_BASE = fs
  .readFileSync(
    path.join(repoRoot, 'packages', 'cli', 'src', 'utils', 'registry.ts'),
    'utf8'
  )
  .match(/const\s+REMOTE_REGISTRY_BASE\s*=\s*(['"`])([^'"`]+)\1/)[2];

/** A component manifest for `<platform>/<name>/styled`. */
function componentManifest(platform, name, extra = {}) {
  return {
    name,
    platform,
    style: 'styled',
    dependencies: [],
    files: [{ path: 'files/widget.tsx', type: 'component', description: '' }],
    registryUrl: `${REMOTE_REGISTRY_BASE}/${platform}/${name}/styled`,
    exports: { mainComponent: 'Widget', mainFile: 'widget' },
    ...extra,
  };
}

/**
 * A valid registry as a map of relative path -> file content (objects are
 * written as JSON). It has a component with shared pieces on each platform, a
 * component without any, and a piece reached only through a requirement.
 */
function validRegistry() {
  return {
    'react/widget/styled/registry.json': componentManifest('react', 'widget', {
      files: [
        { path: 'files/widget.tsx', type: 'component', description: '' },
        { path: 'files/parts/row.tsx', type: 'component', description: '' },
      ],
      shared: ['user-avatar', 'from-now'],
    }),
    'react/widget/styled/files/widget.tsx': [
      'import { UserAvatar } from "~shared/react/user-avatar";',
      'import { Row } from "./parts/row";',
      'export default function Widget() { return null; }',
    ].join('\n'),
    'react/widget/styled/files/parts/row.tsx': [
      "import { FromNow } from '~shared/react/from-now';",
      // Covered through user-avatar's requirement, not listed directly.
      'import { resetDiv } from "~shared/react/reset-styles";',
      'export const Row = () => null;',
    ].join('\n'),

    'react/plain/styled/registry.json': componentManifest('react', 'plain'),
    'react/plain/styled/files/widget.tsx':
      'export default function Widget() { return null; }',

    'react-native/widget/styled/registry.json': componentManifest(
      'react-native',
      'widget',
      { shared: ['from-now'] }
    ),
    'react-native/widget/styled/files/widget.tsx': [
      'import { FromNow } from "~shared/react-native/from-now";',
      'export default function Widget() { return null; }',
    ].join('\n'),

    'shared/react/shared.json': {
      platform: 'react',
      pieces: {
        'user-avatar': {
          files: ['user-avatar.tsx'],
          requires: ['get-user-avatar', 'reset-styles'],
          dependencies: [],
        },
        'get-user-avatar': {
          files: ['get-user-avatar.ts'],
          requires: [],
          dependencies: [],
        },
        'reset-styles': { files: ['reset-styles.ts'], requires: [], dependencies: [] },
        'from-now': {
          files: ['from-now.tsx'],
          requires: [],
          dependencies: ['moment@^2', '@giphy/js-fetch-api@^5.7.0'],
        },
      },
    },
    'shared/react/user-avatar.tsx': [
      'import { getUserAvatar } from "./get-user-avatar";',
      "import { resetDiv } from './reset-styles';",
      'export const UserAvatar = () => null;',
    ].join('\n'),
    'shared/react/get-user-avatar.ts': 'export const getUserAvatar = () => "";',
    'shared/react/reset-styles.ts': 'export const resetDiv = {};',
    'shared/react/from-now.tsx': [
      'import moment from "moment";',
      'export const FromNow = () => null;',
    ].join('\n'),

    'shared/react-native/shared.json': {
      platform: 'react-native',
      pieces: {
        'from-now': { files: ['from-now.tsx'], requires: [], dependencies: ['moment@^2'] },
      },
    },
    'shared/react-native/from-now.tsx': 'export const FromNow = () => null;',
  };
}

const tempDirs = [];
process.on('exit', () => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
});

/** Write a registry to a temp directory and run the script against it. */
function check(registry) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'registry-integrity-'));
  tempDirs.push(tmp);
  const root = path.join(tmp, 'registry');

  for (const [relativePath, content] of Object.entries(registry)) {
    if (content === undefined) continue;
    const target = path.join(root, ...relativePath.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(
      target,
      typeof content === 'string' ? content : JSON.stringify(content, null, 2)
    );
  }

  const result = spawnSync(process.execPath, [script], {
    env: { ...process.env, SUBLAY_REGISTRY_ROOT: root },
    encoding: 'utf8',
  });

  return {
    code: result.status,
    output: `${result.stdout}${result.stderr}`,
  };
}

/** Change one shared manifest in place. */
function editShared(registry, platform, edit) {
  edit(registry[`shared/${platform}/shared.json`].pieces);
  return registry;
}

function assertFails(result, pattern) {
  assert.equal(result.code, 1, `expected exit 1, got ${result.code}:\n${result.output}`);
  assert.match(result.output, pattern);
}

test('passes on the real registry', () => {
  const result = spawnSync(process.execPath, [script], {
    // GITHUB_ACTIONS is cleared so this never runs the live reachability
    // check, which belongs to the workflow's own run of the script.
    env: { ...process.env, SUBLAY_REGISTRY_ROOT: '', GITHUB_ACTIONS: '' },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
});

test('passes on a valid registry with shared pieces', () => {
  const result = check(validRegistry());
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /2 shared\.json file\(s\), 5 piece\(s\), 2 component "shared" list\(s\)/);
  assert.match(result.output, /Skipping live registry reachability check \(SUBLAY_REGISTRY_ROOT/);
});

test('passes on a registry with no shared folder', () => {
  const registry = Object.fromEntries(
    Object.entries(validRegistry()).filter(([file]) => file.startsWith('react/plain/'))
  );
  const result = check(registry);
  assert.equal(result.code, 0, result.output);
});

test('does not treat shared.json as a component manifest', () => {
  // A shared folder on its own has no registry.json: the walk finds nothing.
  const registry = Object.fromEntries(
    Object.entries(validRegistry()).filter(([file]) => file.startsWith('shared/'))
  );
  assertFails(check(registry), /no registry\/\*\*\/registry\.json files found/);
});

test('still enforces the component invariants under a fixture root', () => {
  const registry = validRegistry();
  registry['react/plain/styled/registry.json'].registryUrl = 'https://example.com/x';
  registry['react/plain/styled/registry.json'].exports.mainFile = 'nope';
  const result = check(registry);
  assertFails(result, /registryUrl mismatch/);
  assert.match(result.output, /exports\.mainFile "nope" has no matching files\[\] entry/);
});

test('fails on a shared name that is not a piece', () => {
  const registry = validRegistry();
  registry['react/widget/styled/registry.json'].shared.push('emoji-bar');
  assertFails(
    check(registry),
    /react\/widget\/styled\/registry\.json: shared piece "emoji-bar" is not defined in shared\/react\/shared\.json/
  );
});

test('fails on a shared name that only exists for the other platform', () => {
  const registry = validRegistry();
  registry['react-native/widget/styled/registry.json'].shared.push('user-avatar');
  assertFails(
    check(registry),
    /shared piece "user-avatar" is not defined in shared\/react-native\/shared\.json/
  );
});

test('fails on a shared list that is not an array of names', () => {
  const registry = validRegistry();
  registry['react/widget/styled/registry.json'].shared = 'user-avatar';
  assertFails(check(registry), /"shared" must be an array of shared piece names/);
});

test('fails on an alias import the shared list does not cover', () => {
  const registry = validRegistry();
  registry['react/widget/styled/registry.json'].shared = ['user-avatar'];
  assertFails(
    check(registry),
    /files\/parts\/row\.tsx imports "~shared\/react\/from-now", but "from-now" is not covered/
  );
});

test('fails on an alias import in a component with no shared list', () => {
  const registry = validRegistry();
  registry['react/plain/styled/files/widget.tsx'] =
    'import("~shared/react/from-now");\nexport default function Widget() { return null; }';
  assertFails(
    check(registry),
    /react\/plain\/styled\/registry\.json: files\/widget\.tsx imports "~shared\/react\/from-now"/
  );
});

test('fails on an alias import of another platform', () => {
  const registry = validRegistry();
  registry['react-native/widget/styled/files/widget.tsx'] =
    'import { FromNow } from "~shared/react/from-now";\nexport default function Widget() { return null; }';
  assertFails(check(registry), /a shared piece of another platform \(this component is react-native\)/);
});

test('fails on a requirement cycle', () => {
  const registry = editShared(validRegistry(), 'react', (pieces) => {
    pieces['get-user-avatar'].requires = ['reset-styles'];
    pieces['reset-styles'].requires = ['user-avatar'];
  });
  assertFails(
    check(registry),
    /requirement cycle between shared pieces: user-avatar -> get-user-avatar -> reset-styles -> user-avatar/
  );
});

test('fails on a piece that requires itself', () => {
  const registry = editShared(validRegistry(), 'react', (pieces) => {
    pieces['from-now'].requires = ['from-now'];
  });
  assertFails(check(registry), /requirement cycle between shared pieces: from-now -> from-now/);
});

test('fails on a requirement that is not a piece', () => {
  const registry = editShared(validRegistry(), 'react', (pieces) => {
    pieces['from-now'].requires = ['moment-locale'];
  });
  assertFails(
    check(registry),
    /piece "from-now" requires "moment-locale", which is not a piece in this manifest/
  );
});

test('fails on a missing shared file', () => {
  const registry = validRegistry();
  registry['shared/react/reset-styles.ts'] = undefined;
  assertFails(
    check(registry),
    /piece "reset-styles" lists "reset-styles\.ts", which does not resolve to a file/
  );
});

test('fails on a piece with no file named after it', () => {
  const registry = editShared(validRegistry(), 'react', (pieces) => {
    pieces['from-now'].files = ['FromNow.tsx'];
  });
  registry['shared/react/FromNow.tsx'] = 'export const FromNow = () => null;';
  assertFails(check(registry), /piece "from-now" has no file named after it/);
});

test('fails on a shared file that imports the alias', () => {
  const registry = validRegistry();
  registry['shared/react/user-avatar.tsx'] = [
    'import { getUserAvatar } from "./get-user-avatar";',
    'import { resetDiv } from "~shared/react/reset-styles";',
  ].join('\n');
  assertFails(
    check(registry),
    /shared\/react\/user-avatar\.tsx: imports "~shared\/react\/reset-styles": a shared file imports other pieces with a relative path/
  );
});

test('fails on a shared file that imports a component path', () => {
  const registry = validRegistry();
  registry['shared/react/from-now.tsx'] =
    'import { Row } from "../../react/widget/styled/files/parts/row";';
  assertFails(
    check(registry),
    /shared\/react\/from-now\.tsx: imports "\.\.\/\.\.\/react\/widget\/styled\/files\/parts\/row", which is outside react's shared folder/
  );
});

test('fails on a relative import between pieces that requires does not mirror', () => {
  const registry = editShared(validRegistry(), 'react', (pieces) => {
    pieces['user-avatar'].requires = ['get-user-avatar'];
  });
  // Keep the component covered so only the shared-file rule fires.
  registry['react/widget/styled/registry.json'].shared.push('reset-styles');
  assertFails(
    check(registry),
    /piece "user-avatar" imports "\.\/reset-styles" in user-avatar\.tsx but does not list "reset-styles" in "requires"/
  );
});

test('fails on a relative import of a file no piece lists', () => {
  const registry = validRegistry();
  registry['shared/react/helper.ts'] = 'export const helper = 1;';
  registry['shared/react/from-now.tsx'] = 'import { helper } from "./helper";';
  assertFails(
    check(registry),
    /shared\/react\/from-now\.tsx: imports "\.\/helper", which is not a file of any piece/
  );
});

test('fails on a malformed shared manifest', () => {
  const wrongPlatform = validRegistry();
  wrongPlatform['shared/react/shared.json'].platform = 'react-native';
  assertFails(check(wrongPlatform), /"platform" must be the folder name "react", got "react-native"/);

  const noRequires = editShared(validRegistry(), 'react', (pieces) => {
    delete pieces['from-now'].requires;
  });
  assertFails(check(noRequires), /piece "from-now" needs "requires"/);

  const badDependency = editShared(validRegistry(), 'react', (pieces) => {
    pieces['from-now'].dependencies = ['moment'];
  });
  assertFails(check(badDependency), /dependency "moment" that is not of the form name@range/);

  const notJson = validRegistry();
  notJson['shared/react/shared.json'] = '{ not json';
  assertFails(check(notJson), /shared\/react\/shared\.json: is not valid JSON/);

  const missing = validRegistry();
  missing['shared/react/shared.json'] = undefined;
  assertFails(check(missing), /shared\/react\/shared\.json: is missing/);
});
