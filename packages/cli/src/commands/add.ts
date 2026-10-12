import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { SublayConfig } from "./init.js";
import {
  fetchRegistry,
  fetchFile,
  getComponentLocation,
  resolveRegistrySource,
  Registry,
  RegistryError,
  RegistrySource,
} from "../utils/registry.js";
import { transformImports } from "../utils/transform.js";
import { checkComponentDependencies } from "../utils/dependencies.js";
import { stripTypes, convertFileExtension } from "../utils/strip-types.js";

export interface AddOptions {
  /** Branch to read the registry from instead of the default. */
  ref?: string;
}

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
    const registry = await fetchRegistry(componentName, config, source);

    // Expo projects use @sublay/expo instead of @sublay/react-native
    if (config.platform === 'expo') {
      registry.dependencies = registry.dependencies.map((dep) =>
        dep.startsWith('@sublay/react-native')
          ? dep.replace('@sublay/react-native', '@sublay/expo')
          : dep
      );
    }

    spinner.text = "Downloading files...";

    // Fetch and transform every file before writing any of them: a file that
    // cannot be fetched fails the whole command and leaves the project
    // untouched, rather than installing a component with a hole in it.
    const location = getComponentLocation(componentName, config);
    const componentFiles = registry.files.filter(
      // Skip development files
      (file) => !shouldExcludeFile(file.path)
    );

    const pendingFiles = await mapWithConcurrency(
      componentFiles,
      FETCH_CONCURRENCY,
      async (file): Promise<PendingFile> => {
        const fileContent = await fetchFile(source, location, file.path);
        return prepareFile(file.path, fileContent, config, componentName);
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

    // Check dependencies
    await checkComponentDependencies(registry.dependencies);

    // Show usage example
    const componentInfo = getComponentInfo(registry);
    const relativeImportPath = path.relative(
      process.cwd(),
      path.join(config.paths.components, componentName)
    );
    console.log(chalk.bold("\n📖 Usage:"));
    console.log(
      chalk.dim(
        `  import { ${componentInfo.mainComponent} } from './${relativeImportPath}';`
      )
    );
    if (componentInfo.typeExport) {
      console.log(chalk.dim(`  // With types:`));
      console.log(
        chalk.dim(
          `  import { ${componentInfo.mainComponent}, type ${componentInfo.typeExport} } from './${relativeImportPath}';`
        )
      );
    }

    // Some dependencies need app-level wiring the installer cannot do for you.
    printAppSetupNotes(registry.dependencies);

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
  // Transform imports to match user's project
  let transformed = transformImports(fileContent, config);

  // Strip TypeScript types if project is JavaScript
  let finalFilePath = filePath;
  if (!config.typescript && (filePath.endsWith('.ts') || filePath.endsWith('.tsx'))) {
    transformed = await stripTypes(transformed, filePath);
    finalFilePath = convertFileExtension(filePath);
  }

  return {
    targetPath: getTargetPath(finalFilePath, config, componentName),
    content: transformed,
  };
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

  const aliases = config.aliases;
  if (typeof aliases !== "object" || aliases === null) {
    return false;
  }
  if (typeof (aliases as Record<string, unknown>)["@/components"] !== "string") {
    return false;
  }

  return true;
}

/**
 * Print notes for dependencies that require app-level setup the CLI can't perform.
 */
function printAppSetupNotes(dependencies: string[]): void {
  const deps = dependencies.map((dep) => dep.toLowerCase());
  const usesNativeWind = deps.some((dep) => dep.includes('nativewind'));
  const usesBottomSheet = deps.some((dep) => dep.includes('@gorhom/bottom-sheet'));

  if (!usesNativeWind && !usesBottomSheet) {
    return;
  }

  console.log(chalk.bold('\n🔧 App-level setup required:'));

  if (usesNativeWind) {
    console.log(
      chalk.yellow('  • NativeWind: these files use `className` props.')
    );
    console.log(
      chalk.dim(
        '    Wire up babel.config.js, metro.config.js, and add this component'
      )
    );
    console.log(
      chalk.dim("    directory to your Tailwind config's `content` globs.")
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
