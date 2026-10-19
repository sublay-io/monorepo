import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { SublayConfig } from "./init.js";
import {
  fetchRegistry,
  fetchFile,
  pinRegistrySource,
  fetchSharedFile,
  fetchSharedManifest,
  getComponentLocation,
  getRegistryPlatform,
  getSharedManifestPath,
  resolveRegistrySource,
  resolveSharedPieces,
  validateComponentName,
  Registry,
  RegistryError,
  RegistrySource,
  ResolvedSharedPiece,
} from "../utils/registry.js";
import { findSharedAliasImports, transformImports } from "../utils/transform.js";
import {
  checkComponentDependencies,
  mergeDependencies,
  parseDependencyName,
} from "../utils/dependencies.js";
import { stripTypes, convertFileExtension } from "../utils/strip-types.js";
import { detectFramework, Framework } from "../utils/detect.js";

export interface AddOptions {
  /** Branch to read the registry from instead of the default. */
  ref?: string;
  /** Language to install the component's text in instead of English. */
  lang?: string;
}

// The file that holds a component's text, and the language it is written in.
export const STRINGS_FILE = "utils/strings.ts";
export const DEFAULT_LANGUAGE = "en";

// The file a component reads settings from the app's environment with
// (API keys and the like), written for the project's framework.
export const ENV_FILE = "utils/env.ts";

/** A file fetched and transformed in memory, waiting to be written. */
interface PendingFile {
  /** Path relative to the project root. */
  targetPath: string;
  content: string;
}

// How many registry files are requested at once.
const FETCH_CONCURRENCY = 8;

export async function add(componentName: string, options: AddOptions = {}) {
  const spinner = ora("Initializing...").start();

  try {
    // Settle where the registry is read from before touching anything: an
    // unusable --ref is rejected here, ahead of any request.
    let source: RegistrySource;
    try {
      // The component name is part of every path and URL built below.
      const nameProblem = validateComponentName(componentName);
      if (nameProblem) {
        throw new RegistryError(nameProblem);
      }
      source = resolveRegistrySource(options.ref);
    } catch (error) {
      if (error instanceof RegistryError) {
        spinner.fail(error.message);
        process.exit(1);
      }
      throw error;
    }

    // Read configuration
    const configPath = path.join(process.cwd(), "sublay.json");

    if (!(await fs.pathExists(configPath))) {
      spinner.fail("No sublay.json found");
      console.log(chalk.yellow("\n⚠️  Please run: npx @sublay/cli init"));
      process.exit(1);
    }

    // sublay.json is written by `init`, but it is just a file on disk: it gets
    // hand-edited, half-written by non-interactive scaffolding, or copied
    // between projects. Anything missing surfaces much later as an internal
    // TypeError inside path.join()/transformImports(), so validate up front.
    let rawConfig: unknown;
    try {
      rawConfig = await fs.readJson(configPath);
    } catch {
      // Invalid JSON — treated exactly like an invalid shape below.
      rawConfig = null;
    }

    if (!isValidConfig(rawConfig)) {
      spinner.fail("sublay.json is malformed");
      console.error(
        chalk.red(
          "\n❌ sublay.json is missing or malformed — delete it and run `npx @sublay/cli init` again."
        )
      );
      process.exit(1);
    }

    const config: SublayConfig = rawConfig;

    // Warn (but never block) when an existing install is about to be overwritten.
    const componentDir = path.join(
      process.cwd(),
      config.paths.components,
      componentName
    );

    if (await fs.pathExists(componentDir)) {
      spinner.stop();
      console.log(
        chalk.yellow(`⚠️  Overwriting existing component: ${componentName}`)
      );
      spinner.start(`Fetching ${componentName}...`);
    }

    spinner.text = `Fetching ${componentName}...`;

    // Fetch registry metadata
    // One place for the whole run: local registry or remote, never a mix.
    source = await pinRegistrySource(source, componentName, config);
    const registry = await fetchRegistry(componentName, config, source);

    // Expo projects use @sublay/expo instead of @sublay/react-native
    registry.dependencies = registry.dependencies.map((dep) =>
      renameForPlatform(dep, config)
    );

    // With --lang, the strings file is taken from that language's file.
    const languageFile = resolveLanguageFile(registry, options.lang, componentName);

    // The env file is taken from the project's framework's version, if any.
    const frameworkFile = resolveFrameworkFile(
      registry,
      await detectFramework(config.platform),
      componentName
    );

    // Shared pieces the component lists, plus whatever those require.
    const platform = getRegistryPlatform(config);
    const location = getComponentLocation(componentName, config);
    const componentManifestLabel = `${location}/registry.json`;
    const sharedManifestLabel = getSharedManifestPath(platform);
    const sharedNames = readSharedNames(registry, componentManifestLabel);
    let sharedPieces: ResolvedSharedPiece[] = [];

    if (sharedNames.length > 0) {
      const sharedManifest = await fetchSharedManifest(platform, source);
      sharedPieces = resolveSharedPieces(sharedNames, sharedManifest, {
        componentManifest: componentManifestLabel,
        sharedManifest: sharedManifestLabel,
      });
    }

    // One spec per package: the component's range wins over a piece's.
    const dependencies = mergeDependencies(
      registry.dependencies,
      sharedPieces
        .flatMap((piece) => piece.dependencies)
        .map((dep) => renameForPlatform(dep, config))
    );

    spinner.text =
      sharedPieces.length > 0
        ? `Downloading files and ${sharedPieces.length} shared piece(s)...`
        : "Downloading files...";

    // Fetch and transform every file before writing any of them: a file that
    // cannot be fetched fails the whole command and leaves the project
    // untouched, rather than installing a component with a hole in it.
    const installedPieces = new Set(sharedPieces.map((piece) => piece.name));
    const downloads: Array<{ registryPath: string; shared: boolean }> = [
      ...registry.files.map((file) => ({ registryPath: file.path, shared: false })),
      ...sharedPieces.flatMap((piece) =>
        piece.files.map((file) => ({ registryPath: file, shared: true }))
      ),
    ].filter(
      // Skip development files
      (download) => !shouldExcludeFile(download.registryPath)
    );

    const pendingFiles = await mapWithConcurrency(
      downloads,
      FETCH_CONCURRENCY,
      async ({ registryPath, shared }): Promise<PendingFile> => {
        const fileContent = shared
          ? await fetchSharedFile(source, platform, registryPath)
          : await fetchFile(
              source,
              location,
              languageFile && registryPath === STRINGS_FILE
                ? languageFile
                : frameworkFile && registryPath === ENV_FILE
                  ? frameworkFile
                  : registryPath
            );

        // Every shared piece a file imports has to be one that is being
        // installed, or the import is rewritten to a file that is not there.
        for (const used of findSharedAliasImports(fileContent)) {
          if (used.platform !== platform || !installedPieces.has(used.piece)) {
            throw new RegistryError(
              `${registryPath} imports the shared piece "${used.platform}/${used.piece}", which ${componentManifestLabel} does not list under "shared" for ${sharedManifestLabel}.`
            );
          }
        }

        return prepareFile(
          shared ? `shared/${registryPath}` : registryPath,
          fileContent,
          config,
          componentName
        );
      }
    );

    // Write the files
    let filesInstalled = 0;

    for (const file of pendingFiles) {
      const fullPath = path.join(process.cwd(), file.targetPath);

      // Ensure directory exists
      await fs.ensureDir(path.dirname(fullPath));

      // Write file
      await fs.writeFile(fullPath, file.content, "utf-8");
      filesInstalled++;
    }

    // Create barrel export index file
    spinner.text = "Creating index file...";
    await createIndexFile(componentName, config, registry);
    filesInstalled++;

    spinner.succeed(`Added ${componentName}`);

    // Show success message
    console.log(
      chalk.green(`\n✅ Successfully installed ${filesInstalled} files!`)
    );
    console.log(
      chalk.dim(
        `\n📁 Files added to ${path.join(
          config.paths.components,
          componentName
        )}`
      )
    );
    if (sharedPieces.length > 0) {
      console.log(
        chalk.dim(
          `🧩 Shared pieces in ${path.join(
            config.paths.components,
            componentName,
            "shared"
          )}: ${sharedPieces.map((piece) => piece.name).join(", ")}`
        )
      );
    }

    // Check dependencies: the component's own plus what its shared pieces need
    await checkComponentDependencies(dependencies, config.platform);

    // Show usage example
    const componentInfo = getComponentInfo(registry);
    const importPath = `./${path
      .relative(process.cwd(), path.join(config.paths.components, componentName))
      .split(path.sep)
      .join("/")}`;
    console.log(chalk.bold("\n📖 Usage:"));
    if (registry.usage?.length) {
      // The component's own example, with the path it was installed at
      for (const line of formatUsage(registry.usage, importPath)) {
        console.log(chalk.dim(`  ${line}`));
      }
    } else {
      console.log(
        chalk.dim(`  import { ${componentInfo.mainComponent} } from '${importPath}';`)
      );
    }
    if (!registry.usage?.length && componentInfo.typeExport) {
      console.log(chalk.dim(`  // With types:`));
      console.log(
        chalk.dim(
          `  import { ${componentInfo.mainComponent}, type ${componentInfo.typeExport} } from '${importPath}';`
        )
      );
    }

    // Some dependencies need app-level wiring the installer cannot do for you.
    printAppSetupNotes(dependencies, config.platform);

    console.log();
  } catch (error) {
    if (error instanceof RegistryError) {
      // An expected failure (missing branch, component or file): the message
      // already says what is missing, so no stack trace.
      spinner.fail(error.message);
      console.error(chalk.dim("\nNothing was written to your project."));
      process.exit(1);
    }
    spinner.fail("Failed to add component");
    console.error(chalk.red("\n❌ Error:"), error);
    process.exit(1);
  }
}

/**
 * Turn one fetched registry file into what gets written: imports rewritten for
 * the installed layout, types stripped for JavaScript projects, and its place
 * in the project worked out.
 */
async function prepareFile(
  filePath: string,
  fileContent: string,
  config: SublayConfig,
  componentName: string
): Promise<PendingFile> {
  const componentDir = path.join(config.paths.components, componentName);

  // Strip TypeScript types if project is JavaScript
  const needsTypeStrip =
    !config.typescript && (filePath.endsWith('.ts') || filePath.endsWith('.tsx'));
  const finalFilePath = needsTypeStrip ? convertFileExtension(filePath) : filePath;

  const targetPath = getTargetPath(finalFilePath, config, componentName);
  const installedPath = path
    .relative(componentDir, targetPath)
    .split(path.sep)
    .join('/');

  // Registry paths come from a manifest; none may land outside the component.
  if (
    installedPath === '..' ||
    installedPath.startsWith('../') ||
    path.isAbsolute(installedPath)
  ) {
    throw new RegistryError(
      `${filePath} would be installed outside ${componentDir}; refusing to write it.`
    );
  }

  // Transform imports to match user's project
  let transformed = transformImports(fileContent, config, { installedPath });

  if (needsTypeStrip) {
    transformed = await stripTypes(transformed, filePath);
  }

  return { targetPath, content: transformed };
}

/** Expo projects use @sublay/expo instead of @sublay/react-native. */
function renameForPlatform(dep: string, config: SublayConfig): string {
  return config.platform === 'expo' && dep.startsWith('@sublay/react-native')
    ? dep.replace('@sublay/react-native', '@sublay/expo')
    : dep;
}

/**
 * The registry file that replaces the component's strings file for `lang`,
 * or null when the component is installed as it is (no `--lang`, or English).
 */
export function resolveLanguageFile(
  registry: Pick<Registry, "files" | "languages">,
  lang: string | undefined,
  componentName: string
): string | null {
  if (lang === undefined || lang === DEFAULT_LANGUAGE) {
    return null;
  }

  const languages =
    registry.languages && typeof registry.languages === "object"
      ? registry.languages
      : {};
  const available = [DEFAULT_LANGUAGE, ...Object.keys(languages)].join(", ");
  const languageFile = Object.prototype.hasOwnProperty.call(languages, lang)
    ? languages[lang]
    : undefined;

  if (languageFile === undefined) {
    throw new RegistryError(
      `${componentName} is not available in "${lang}". Available languages: ${available}.`
    );
  }

  // The path is requested from the registry as it is written in the manifest.
  if (
    typeof languageFile !== "string" ||
    !/^[A-Za-z0-9_][A-Za-z0-9._/-]*$/.test(languageFile) ||
    languageFile.split("/").includes("..")
  ) {
    throw new RegistryError(
      `The "${lang}" entry under "languages" for ${componentName} is not a usable file path.`
    );
  }

  if (!registry.files.some((file) => file.path === STRINGS_FILE)) {
    throw new RegistryError(
      `${componentName} lists languages but has no ${STRINGS_FILE} to put them in.`
    );
  }

  return languageFile;
}

/**
 * The registry file that replaces the component's env file for `framework`,
 * or null when the component is installed as it is (it lists no version for
 * that framework, or no frameworks at all).
 */
export function resolveFrameworkFile(
  registry: Pick<Registry, "files" | "frameworks">,
  framework: Framework,
  componentName: string
): string | null {
  const frameworks =
    registry.frameworks && typeof registry.frameworks === "object"
      ? registry.frameworks
      : {};
  const frameworkFile = Object.prototype.hasOwnProperty.call(frameworks, framework)
    ? frameworks[framework]
    : undefined;

  if (frameworkFile === undefined) {
    return null;
  }

  // The path is requested from the registry as it is written in the manifest.
  if (
    typeof frameworkFile !== "string" ||
    !/^[A-Za-z0-9_][A-Za-z0-9._/-]*$/.test(frameworkFile) ||
    frameworkFile.split("/").includes("..")
  ) {
    throw new RegistryError(
      `The "${framework}" entry under "frameworks" for ${componentName} is not a usable file path.`
    );
  }

  if (!registry.files.some((file) => file.path === ENV_FILE)) {
    throw new RegistryError(
      `${componentName} lists frameworks but has no ${ENV_FILE} to put them in.`
    );
  }

  return frameworkFile;
}

/** The manifest's `shared` list. Absent means the component uses no shared pieces. */
function readSharedNames(registry: Registry, manifestLabel: string): string[] {
  const { shared } = registry;

  if (shared === undefined || shared === null) {
    return [];
  }

  if (!Array.isArray(shared) || shared.some((name) => typeof name !== 'string')) {
    throw new RegistryError(
      `"shared" in ${manifestLabel} must be a list of shared piece names.`
    );
  }

  return shared;
}

/** Like Promise.all over `items.map(task)`, but at most `limit` tasks run at once. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );

  return results;
}

/**
 * Structural check for a config loaded off disk. `fs.readJson` returns `any`,
 * so the `SublayConfig` annotation at the call site is an assertion, not a
 * guarantee — this is the only thing standing between a truncated or
 * hand-edited sublay.json and a raw stack trace.
 */
function isValidConfig(value: unknown): value is SublayConfig {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const config = value as Record<string, unknown>;

  if (
    config.platform !== "react" &&
    config.platform !== "react-native" &&
    config.platform !== "expo"
  ) {
    return false;
  }

  if (config.style !== "styled" && config.style !== "tailwind") {
    return false;
  }

  if (typeof config.typescript !== "boolean") {
    return false;
  }

  const paths = config.paths;
  if (typeof paths !== "object" || paths === null) {
    return false;
  }
  if (typeof (paths as Record<string, unknown>).components !== "string") {
    return false;
  }

  return true;
}

/**
 * Print notes for dependencies that require app-level setup the CLI can't perform.
 */
function printAppSetupNotes(dependencies: string[], platform: SublayConfig["platform"]): void {
  const deps = dependencies.map((dep) => parseDependencyName(dep).toLowerCase());
  const usesNativeWind = deps.includes('nativewind');
  const usesBottomSheet = deps.includes('@gorhom/bottom-sheet');
  // Expo installs Reanimated's worklets package with it (see dependencies.ts);
  // elsewhere the package manager may not, and the app crashes at launch.
  const needsWorkletsNote = platform === 'react-native' && deps.includes('react-native-reanimated');

  if (!usesNativeWind && !usesBottomSheet && !needsWorkletsNote) {
    return;
  }

  console.log(chalk.bold('\n🔧 App-level setup required:'));

  if (usesNativeWind) {
    console.log(
      chalk.yellow('  • NativeWind: these files use `className` props.')
    );
    console.log(
      chalk.dim(
        '    Set it up (Tailwind config, global.css, babel.config.js, metro.config.js)'
      )
    );
    console.log(
      chalk.dim("    and add this component's directory to your Tailwind `content`:")
    );
    console.log(
      chalk.dim('    https://www.nativewind.dev/docs/getting-started/installation')
    );
  }

  if (usesBottomSheet) {
    console.log(
      chalk.yellow('  • Bottom sheets need a gesture-handler root.')
    );
    console.log(
      chalk.dim(
        '    Wrap your app root in <GestureHandlerRootView style={{ flex: 1 }}>'
      )
    );
    console.log(chalk.dim("    from 'react-native-gesture-handler'."));
  }

  if (needsWorkletsNote) {
    console.log(
      chalk.yellow('  • Reanimated 4 also needs react-native-worklets.')
    );
    console.log(
      chalk.dim(
        "    If your package manager didn't add it, install the version Reanimated's"
      )
    );
    console.log(
      chalk.dim(
        '    guide names: https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/'
      )
    );
  }

  console.log(chalk.dim('\n  Setup guides: https://docs.sublay.io'));
}

export function getTargetPath(
  filePath: string,
  config: SublayConfig,
  componentName: string
): string {
  // Create parent directory for the component
  const componentDir = path.join(config.paths.components, componentName);

  // Check if it's a hook, util, or context file
  if (filePath.startsWith("hooks/")) {
    return path.join(componentDir, "hooks", path.basename(filePath));
  }
  if (filePath.startsWith("utils/")) {
    return path.join(componentDir, "utils", path.basename(filePath));
  }
  if (filePath.startsWith("context/")) {
    return path.join(componentDir, "context", path.basename(filePath));
  }

  // Shared pieces go into the component's own 'shared/' folder
  if (filePath.startsWith("shared/")) {
    return path.join(componentDir, "shared", filePath.substring(7));
  }

  // Component files from 'files/' go into 'components/' subdirectory
  if (filePath.startsWith("files/")) {
    const normalizedPath = filePath.substring(6); // Remove 'files/' prefix
    return path.join(componentDir, "components", normalizedPath);
  }

  // Fallback for any other files
  return path.join(componentDir, filePath);
}

async function createIndexFile(
  componentName: string,
  config: SublayConfig,
  registry: Registry
): Promise<void> {
  const componentDir = path.join(
    process.cwd(),
    config.paths.components,
    componentName
  );

  // Use .js for JavaScript projects, .ts for TypeScript projects
  const indexExtension = config.typescript ? 'ts' : 'js';
  const indexPath = path.join(componentDir, `index.${indexExtension}`);

  // Get component info dynamically
  const componentInfo = getComponentInfo(registry);

  // Generate index content dynamically
  const indexContent = `export { default as ${componentInfo.mainComponent} } from './components/${componentInfo.mainFile}';
export * from './components/${componentInfo.mainFile}';
`;

  // Write index file
  await fs.writeFile(indexPath, indexContent, "utf-8");
}

/**
 * A manifest's `usage` lines, with `{importPath}` replaced by the path the
 * component was installed at.
 */
export function formatUsage(usage: string[], importPath: string): string[] {
  return usage.map((line) => line.split("{importPath}").join(importPath));
}

interface ComponentInfo {
  mainComponent: string;
  mainFile: string;
  typeExport: string;
}

function getComponentInfo(registry: Registry): ComponentInfo {
  // Registry exports metadata is now required
  return {
    mainComponent: registry.exports.mainComponent,
    mainFile: registry.exports.mainFile,
    typeExport: registry.exports.typeExports?.[0] || "",
  };
}

/**
 * Check if a file should be excluded from installation (development files only)
 */
function shouldExcludeFile(filePath: string): boolean {
  const fileName = path.basename(filePath);
  const excludedFiles = [
    'package.json',
    'tsconfig.json',
    '.gitignore',
    'pnpm-lock.yaml',
    'package-lock.json',
    'yarn.lock',
    '.eslintrc',
    '.prettierrc',
  ];

  // Exclude specific files
  if (excludedFiles.includes(fileName)) {
    return true;
  }

  // Exclude node_modules directory
  if (filePath.includes('node_modules')) {
    return true;
  }

  // Exclude hidden files (starting with .)
  if (fileName.startsWith('.')) {
    return true;
  }

  return false;
}
