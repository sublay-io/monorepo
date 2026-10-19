import { SublayConfig } from '../commands/init.js';

// An import of a shared piece in registry source: `~shared/<platform>/<piece>`,
// in the `from '...'`, side-effect `import '...'`, dynamic `import('...')` and
// `require('...')` forms. Groups: 1 keyword and spacing, 2 quote, 3 platform,
// 4 piece.
const SHARED_ALIAS_IMPORT =
  /\b((?:from|import|require)\s*\(?\s*)(['"])~shared\/([^'"/]+)\/([^'"]+)\2/g;

export interface SharedAliasImport {
  platform: string;
  piece: string;
}

/** Every shared-piece import in a registry source file. */
export function findSharedAliasImports(content: string): SharedAliasImport[] {
  return Array.from(content.matchAll(SHARED_ALIAS_IMPORT), (match) => ({
    platform: match[3],
    piece: match[4],
  }));
}

export interface TransformOptions {
  /**
   * Where the file is installed, relative to the component's own directory,
   * with forward slashes (`components/comments-feed/comment/comment.tsx`).
   * Needed to rewrite shared-piece imports, which become relative paths to
   * the component's `shared/` folder.
   */
  installedPath?: string;
}

export function transformImports(
  content: string,
  config: SublayConfig,
  options: TransformOptions = {}
): string {
  let transformed = content;

  // Shared pieces are installed in '<componentDir>/shared/'. Registry source
  // imports them through the '~shared/<platform>/<piece>' alias; the installed
  // file needs the relative path from its own folder.
  const { installedPath } = options;
  if (installedPath !== undefined) {
    const fromDir = posixDirname(installedPath);
    transformed = transformed.replace(
      SHARED_ALIAS_IMPORT,
      (_match, lead: string, quote: string, _platform: string, piece: string) =>
        `${lead}${quote}${relativeImportPath(fromDir, `shared/${piece}`)}${quote}`
    );
  }

  // Transform registry 'files/' references to 'components/' in the installed structure
  // This handles imports like: import { Foo } from '../files/bar' → import { Foo } from '../components/bar'
  transformed = transformed.replace(/from(\s+)(['"])\.\.\/files\//g, 'from$1$2../components/');
  transformed = transformed.replace(/import(\s+)(['"])\.\.\/files\//g, 'import$1$2../components/');

  // Handle dynamic imports as well
  transformed = transformed.replace(/import\((['"])\.\.\/files\//g, 'import($1../components/');

  // Expo projects use @sublay/expo instead of @sublay/react-native
  if (config.platform === 'expo') {
    transformed = transformed.replace(
      /from\s+["']@sublay\/react-native["']/g,
      'from "@sublay/expo"'
    );
    // The file header lists the packages the component needs
    // (" * - @sublay/react-native ^8.0.0"); name the one that is imported.
    transformed = transformed.replace(
      /^(\s*\*\s+-\s+)@sublay\/react-native(?=\s|$)/gm,
      '$1@sublay/expo'
    );
  }

  return transformed;
}

export function transformPaths(filePath: string, config: SublayConfig): string {
  // Transform file paths if needed
  // For now, just return as-is
  return filePath;
}

function posixDirname(filePath: string): string {
  const index = filePath.lastIndexOf('/');
  return index === -1 ? '' : filePath.slice(0, index);
}

/**
 * The import specifier that reaches `target` from a file in `fromDir`. Both
 * are forward-slash paths relative to the same root.
 */
function relativeImportPath(fromDir: string, target: string): string {
  const from = fromDir.split('/').filter(Boolean);
  const to = target.split('/').filter(Boolean);

  let common = 0;
  while (common < from.length && common < to.length - 1 && from[common] === to[common]) {
    common++;
  }

  const up = from.length - common;
  const down = to.slice(common).join('/');

  return up === 0 ? `./${down}` : `${'../'.repeat(up)}${down}`;
}
