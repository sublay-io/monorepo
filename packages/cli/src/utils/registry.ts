import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { SublayConfig } from '../commands/init.js';

export interface RegistryFile {
  path: string;
  type: string;
  description: string;
}

export interface Registry {
  name: string;
  platform: string;
  style: string;
  version: string;
  description: string;
  dependencies: string[];
  files: RegistryFile[];
  registryUrl: string;
  exports: {
    mainComponent: string;
    mainFile: string;
    typeExports?: string[];
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// For local testing, use the local registry directory
// From dist/ (built) or src/utils/ (source), go up to cli root, then to registry
const LOCAL_REGISTRY_PATH = path.resolve(__dirname, '..', '..', '..', 'registry');

// Production/npx fallback: the registry is served straight off the monorepo
// that also holds this package. This literal names the default ref (`main`);
// `sublay add --ref <branch>` reads the same tree from another branch, and
// that base is derived from this one by swapping the ref segment (see
// getRemoteRegistryBase). Manifest and file URLs are both built from the base
// plus platform/component/style, so a manifest and its files always come from
// the same ref. The `registryUrl` inside each registry.json is an identity
// field checked by .github/scripts/check-registry-integrity.mjs, which also
// regex-reads this declaration: keep it a plain string literal.
const REMOTE_REGISTRY_BASE =
  'https://raw.githubusercontent.com/sublay-io/monorepo/main/registry';

/** The ref `sublay add` reads when no `--ref` is given. */
export const DEFAULT_REGISTRY_REF = 'main';

// Undocumented overrides, for this package's own tests only. They redirect
// registry lookups and nothing else.
//   SUBLAY_REGISTRY_LOCAL_PATH  directory used in place of the repo's registry/
//   SUBLAY_REGISTRY_BASE_URL    replaces REMOTE_REGISTRY_BASE; must have the
//                               same `<prefix>/main/registry` form
const LOCAL_PATH_ENV = 'SUBLAY_REGISTRY_LOCAL_PATH';
const REMOTE_BASE_ENV = 'SUBLAY_REGISTRY_BASE_URL';

type Env = Record<string, string | undefined>;

/** A registry lookup that failed in a way the user should be told about. */
export class RegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegistryError';
  }
}

/**
 * Check a `--ref` value. Returns null when it is usable, otherwise the reason
 * it is not. A ref ends up as a path segment of the download URL, so only
 * characters that are plain in a URL path are accepted, and `..` is refused
 * so a ref can never step out of the repository's own tree.
 */
export function validateRef(ref: string): string | null {
  if (typeof ref !== 'string' || ref.length === 0) {
    return 'A ref cannot be empty.';
  }
  if (!/^[A-Za-z0-9._\-/]+$/.test(ref)) {
    return `Invalid ref "${ref}": a ref may only contain letters, digits, ".", "_", "-" and "/".`;
  }
  const segments = ref.split('/');
  if (segments.some((segment) => segment === '..')) {
    return `Invalid ref "${ref}": a ref cannot contain a ".." segment.`;
  }
  if (segments.some((segment) => segment.length === 0)) {
    return `Invalid ref "${ref}": a ref cannot start or end with "/" or contain "//".`;
  }
  return null;
}

/**
 * The remote registry base for a ref: REMOTE_REGISTRY_BASE with its ref
 * segment swapped. For the default ref this is REMOTE_REGISTRY_BASE itself.
 */
export function getRemoteRegistryBase(
  ref: string = DEFAULT_REGISTRY_REF,
  env: Env = process.env
): string {
  const base = (env[REMOTE_BASE_ENV] || REMOTE_REGISTRY_BASE).replace(/\/+$/, '');
  const suffix = `/${DEFAULT_REGISTRY_REF}/registry`;

  if (!base.endsWith(suffix)) {
    throw new RegistryError(
      `Registry base URL "${base}" must end with "${suffix}".`
    );
  }

  if (ref === DEFAULT_REGISTRY_REF) {
    return base;
  }

  return `${base.slice(0, -suffix.length)}/${ref}/registry`;
}

/** Where one `add` run reads the registry from. */
export interface RegistrySource {
  /** The ref remote requests are made against. */
  ref: string;
  /** True when the user passed `--ref`. */
  explicitRef: boolean;
  /** Local registry directory tried before the remote, or null to skip it. */
  localRoot: string | null;
  /** Remote base for `ref`, no trailing slash. */
  remoteBase: string;
}

/**
 * Without a ref: the local registry first (development, the playground, this
 * package's tests), then the default ref on GitHub. With a ref: that ref on
 * GitHub only — an explicit ref means "from that branch", so the local
 * registry is not read.
 */
export function resolveRegistrySource(
  ref?: string,
  env: Env = process.env
): RegistrySource {
  if (ref === undefined) {
    return {
      ref: DEFAULT_REGISTRY_REF,
      explicitRef: false,
      localRoot: env[LOCAL_PATH_ENV] || LOCAL_REGISTRY_PATH,
      remoteBase: getRemoteRegistryBase(DEFAULT_REGISTRY_REF, env),
    };
  }

  const problem = validateRef(ref);
  if (problem) {
    throw new RegistryError(problem);
  }

  return {
    ref,
    explicitRef: true,
    localRoot: null,
    remoteBase: getRemoteRegistryBase(ref, env),
  };
}

/** Expo projects share the react-native registry. */
export function getRegistryPlatform(config: SublayConfig): string {
  return config.platform === 'expo' ? 'react-native' : config.platform;
}

/** A component variant's directory, relative to the registry root. */
export function getComponentLocation(
  componentName: string,
  config: SublayConfig
): string {
  return `${getRegistryPlatform(config)}/${componentName}/${config.style}`;
}

/** The remote URL of a path inside the registry, for a source's ref. */
export function getRemoteUrl(source: RegistrySource, registryPath: string): string {
  return `${source.remoteBase}/${registryPath}`;
}

type ReadResult =
  | { ok: true; content: string }
  | { ok: false; url: string; status?: number; reason: string };

/**
 * Read one path from the registry: the local directory when the source has
 * one and the file is there, otherwise the remote.
 */
async function readRegistryPath(
  source: RegistrySource,
  registryPath: string
): Promise<ReadResult> {
  if (source.localRoot) {
    const localPath = path.join(source.localRoot, ...registryPath.split('/'));
    if (await fs.pathExists(localPath)) {
      return { ok: true, content: await fs.readFile(localPath, 'utf-8') };
    }
  }

  const url = getRemoteUrl(source, registryPath);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return {
        ok: false,
        url,
        status: response.status,
        reason: `${response.status} ${response.statusText}`.trim(),
      };
    }

    return { ok: true, content: await response.text() };
  } catch (error) {
    return {
      ok: false,
      url,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Fetch a component's registry.json. Throws a RegistryError naming what is
 * missing: with `--ref`, a missing manifest is told apart from a missing
 * branch by probing registry/package.json, which exists on every ref that has
 * a registry at all.
 */
export async function fetchRegistry(
  componentName: string,
  config: SublayConfig,
  source: RegistrySource
): Promise<Registry> {
  const location = getComponentLocation(componentName, config);
  const result = await readRegistryPath(source, `${location}/registry.json`);

  if (result.ok) {
    try {
      return JSON.parse(result.content) as Registry;
    } catch {
      throw new RegistryError(
        `The registry manifest for "${componentName}" (${location}/registry.json) is not valid JSON.`
      );
    }
  }

  if (result.status !== 404) {
    throw new RegistryError(
      `Failed to fetch registry from ${result.url}: ${result.reason}`
    );
  }

  if (!source.explicitRef) {
    throw new RegistryError(
      `Component "${componentName}" with style "${config.style}" not found in registry.`
    );
  }

  const probe = await readRegistryPath(source, 'package.json');

  if (probe.ok) {
    throw new RegistryError(
      `Component "${componentName}" with style "${config.style}" not found on branch "${source.ref}".`
    );
  }

  if (probe.status === 404) {
    throw new RegistryError(
      `Branch "${source.ref}" not found: no registry is served from that branch.`
    );
  }

  throw new RegistryError(
    `Failed to fetch registry from ${probe.url}: ${probe.reason}`
  );
}

/**
 * Fetch one file of a component variant. Throws a RegistryError naming the
 * file when it cannot be read.
 */
export async function fetchFile(
  source: RegistrySource,
  location: string,
  filePath: string
): Promise<string> {
  const result = await readRegistryPath(source, `${location}/${filePath}`);

  if (!result.ok) {
    throw new RegistryError(
      `Could not fetch ${filePath} from ${result.url}: ${result.reason}`
    );
  }

  return result.content;
}
