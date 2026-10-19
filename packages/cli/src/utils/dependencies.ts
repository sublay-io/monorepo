import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import prompts from 'prompts';
import { execa } from 'execa';
import semver from 'semver';

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

/** How each package manager adds packages to a project. */
const ADD_COMMAND: Record<PackageManager, string[]> = {
  npm: ['install'],
  yarn: ['add'],
  pnpm: ['add'],
  bun: ['add'],
};

const LOCK_FILES: [string, PackageManager][] = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['package-lock.json', 'npm'],
];

/**
 * The package manager a project uses: the `packageManager` field of the
 * nearest package.json that has one, or the nearest lock file. Both are looked
 * for from `startDir` up, so a package inside a workspace finds the
 * workspace's lock file at its root. npm when there's neither.
 */
export async function detectPackageManager(startDir: string = process.cwd()): Promise<PackageManager> {
  let dir = path.resolve(startDir);

  while (true) {
    const packageJsonPath = path.join(dir, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      try {
        const field = (await fs.readJson(packageJsonPath)).packageManager;
        if (typeof field === 'string') {
          const name = field.split('@')[0];
          if (name in ADD_COMMAND) return name as PackageManager;
        }
      } catch {
        // An unreadable package.json says nothing about the package manager.
      }
    }

    for (const [lockFile, pm] of LOCK_FILES) {
      if (await fs.pathExists(path.join(dir, lockFile))) {
        return pm;
      }
    }

    const parent = path.dirname(dir);
    if (parent === dir) return 'npm';
    dir = parent;
  }
}

export interface InstallPlan {
  command: string;
  args: string[];
}

/**
 * The command that installs `specs` (as `name@range`) into a project.
 *
 * Expo projects go through `npx expo install`, which picks the version of each
 * package that matches the project's Expo SDK, so third-party packages are
 * passed by name only; `@sublay/*` keep their ranges, which Expo doesn't pin.
 * Installing Reanimated there also installs `react-native-worklets`, the
 * package Reanimated 4 needs alongside it, unless the project already has it.
 * Everything else uses the package manager's own command.
 */
export function planInstall(
  specs: string[],
  options: {
    platform?: string;
    packageManager: PackageManager;
    declared?: Record<string, unknown>;
  }
): InstallPlan {
  if (options.platform === 'expo') {
    const packages = specs.map((spec) =>
      spec.startsWith('@sublay/') ? spec : parseDependencyName(spec)
    );
    if (
      packages.includes('react-native-reanimated') &&
      !packages.includes('react-native-worklets') &&
      !options.declared?.['react-native-worklets']
    ) {
      packages.push('react-native-worklets');
    }
    return { command: 'npx', args: ['expo', 'install', ...packages] };
  }

  return {
    command: options.packageManager,
    args: [...ADD_COMMAND[options.packageManager], ...specs],
  };
}

/**
 * A plan as a command to paste into a shell: arguments with characters the
 * shell would act on (`>=3.16.0` would redirect) are quoted.
 */
export function formatCommand(plan: InstallPlan): string {
  return [plan.command, ...plan.args]
    .map((arg) => (/^[\w@./:^~=-]+$/.test(arg) ? arg : `"${arg}"`))
    .join(' ');
}

async function installDependencies(plan: InstallPlan) {
  try {
    console.log(chalk.blue(`\n📦 Installing: ${formatCommand(plan)}\n`));

    await execa(plan.command, plan.args, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    console.log(chalk.green('\n✅ Dependencies installed successfully'));
  } catch (error) {
    console.error(chalk.red('\n❌ Failed to install dependencies'));
    console.error(error);
  }
}

/**
 * Extract the bare package name from a registry dependency spec.
 * Handles scoped and unscoped packages, with or without a version suffix:
 *   "@sublay/react-js@^7.0.0" -> "@sublay/react-js"
 *   "@sublay/react-js"        -> "@sublay/react-js"
 *   "lucide-react@^1.0.0"     -> "lucide-react"
 *   "lucide-react"            -> "lucide-react"
 */
export function parseDependencyName(dep: string): string {
  const parts = dep.split('@').filter(Boolean);

  // Scoped package: @scope/name[@version] — the leading '@' is stripped by the
  // filter above, so put it back on the first remaining segment.
  if (dep.startsWith('@')) {
    return `@${parts[0]}`;
  }

  // Regular package: name[@version]
  return parts[0];
}

/**
 * Split a registry dependency spec into its package name and version range.
 * The range is empty when the spec names only a package.
 *   "@sublay/react-js@^8.0.0-beta.0" -> { name: "@sublay/react-js", range: "^8.0.0-beta.0" }
 *   "lucide-react"                   -> { name: "lucide-react", range: "" }
 */
export function parseDependencySpec(dep: string): { name: string; range: string } {
  const name = parseDependencyName(dep);
  const rest = dep.slice(name.length);
  return { name, range: rest.startsWith('@') ? rest.slice(1) : '' };
}

/**
 * One list of packages for a component and the shared pieces installed with
 * it: one spec per package name. When a component and a piece both declare a
 * package, the component's spec is the one kept.
 */
export function mergeDependencies(
  componentDependencies: string[],
  sharedDependencies: string[]
): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  for (const dep of [...componentDependencies, ...sharedDependencies]) {
    const name = parseDependencyName(dep);
    if (seen.has(name)) {
      continue;
    }
    seen.add(name);
    merged.push(dep);
  }

  return merged;
}

/**
 * Whether the range a project declares for a package sits entirely below the
 * range a component requires: the two share no version, and the project's is
 * the lower one. Anything that is not a plain version range on either side
 * (`workspace:*`, `latest`, a git or file specifier) is never "below".
 */
export function isDeclaredRangeBelow(declared: string, required: string): boolean {
  const options = { includePrerelease: true };

  if (
    typeof declared !== 'string' ||
    !required ||
    !semver.validRange(declared, options) ||
    !semver.validRange(required, options)
  ) {
    return false;
  }

  if (semver.intersects(declared, required, options)) {
    return false;
  }

  const declaredMin = semver.minVersion(declared);
  const requiredMin = semver.minVersion(required);

  if (!declaredMin || !requiredMin) {
    return false;
  }

  return semver.lt(declaredMin, requiredMin);
}

export interface DependencyUpgrade {
  /** The spec to install, e.g. "@sublay/react-js@^8.0.0-beta.0". */
  spec: string;
  /** The range the project declares today. */
  declared: string;
}

export interface DependencyStatus {
  /** Specs for packages the project does not declare at all. */
  missing: string[];
  /** `@sublay/*` packages the project declares at a range below the required one. */
  upgrades: DependencyUpgrade[];
}

/**
 * Compare what a component needs with what a project declares.
 *
 * A package counts as present when the project declares it, whatever the
 * version — except `@sublay/*` packages, where a declared range entirely below
 * the required one is reported as needing an upgrade. Third-party packages are
 * never compared by version, so a project on another major of one of them is
 * left alone, and nothing is ever reported for a declared range that overlaps
 * the requirement or sits above it.
 */
export function findDependencyStatus(
  dependencies: string[],
  declaredDependencies: Record<string, unknown>
): DependencyStatus {
  const missing: string[] = [];
  const upgrades: DependencyUpgrade[] = [];

  for (const spec of dependencies) {
    const { name, range } = parseDependencySpec(spec);
    const declared = declaredDependencies[name];

    if (!declared) {
      missing.push(spec);
      continue;
    }

    if (
      name.startsWith('@sublay/') &&
      typeof declared === 'string' &&
      isDeclaredRangeBelow(declared, range)
    ) {
      upgrades.push({ spec, declared });
    }
  }

  return { missing, upgrades };
}

/**
 * Check and optionally install component-specific dependencies
 * @param dependencies Array of dependencies in format "package@version"
 * @param platform The project's platform (sublay.json): Expo installs through `npx expo install`
 */
export async function checkComponentDependencies(dependencies: string[], platform?: string) {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');

    if (!(await fs.pathExists(packageJsonPath))) {
      console.log(chalk.yellow('\n⚠️  No package.json found'));
      return;
    }

    const packageJson = await fs.readJson(packageJsonPath);
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const { missing, upgrades } = findDependencyStatus(dependencies, allDeps);

    if (missing.length === 0 && upgrades.length === 0) {
      console.log(chalk.green('\n✅ All required dependencies are installed'));
      return;
    }

    if (missing.length > 0) {
      console.log(chalk.yellow('\n⚠️  Missing required dependencies:'));

      // Show dependencies with their versions
      missing.forEach((dep) => console.log(chalk.dim(`  - ${dep}`)));
    }

    if (upgrades.length > 0) {
      console.log(chalk.yellow('\n⚠️  Dependencies that need an upgrade:'));
      upgrades.forEach(({ spec, declared }) =>
        console.log(chalk.dim(`  - ${spec} (your project has ${declared})`))
      );
    }

    const toInstall = [...missing, ...upgrades.map((upgrade) => upgrade.spec)];
    const plan = planInstall(toInstall, {
      platform,
      packageManager: await detectPackageManager(),
      declared: allDeps,
    });

    // Without a TTY (scripts, CI, agents) there is nobody to answer the prompt.
    // Skip it and take the same branch as an explicit "no" so we never block.
    let install = false;
    if (process.stdin.isTTY) {
      const answer = await prompts({
        type: 'confirm',
        name: 'install',
        message: 'Would you like to install them now?',
        initial: true,
      });
      install = Boolean(answer.install);
    }

    if (install) {
      await installDependencies(plan);
    } else {
      console.log(chalk.dim('\nYou can install them later with:'));
      console.log(chalk.dim(`  ${formatCommand(plan)}\n`));
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Error checking dependencies:'), error);
  }
}
