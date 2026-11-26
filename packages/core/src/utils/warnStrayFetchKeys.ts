import { isDevBuild } from "../helpers/commentThreadConfig";

/**
 * Development builds only: warns when a list fetch (`fetchEntities`,
 * `fetchSpaces`, `fetchWorkspaces`) is given top-level keys it doesn't take —
 * most likely filters passed the way the first argument used to take them,
 * which would otherwise be dropped without a word.
 */
export function warnStrayFetchKeys(
  fn: string,
  props: object | undefined,
  allowed: readonly string[]
): void {
  if (!props || !isDevBuild()) return;
  const stray = Object.keys(props).filter((key) => !allowed.includes(key));
  if (stray.length === 0) return;
  console.warn(
    `[Sublay] ${fn} takes one object, { ${allowed.join(", ")} }; ` +
      `${stray.map((key) => `"${key}"`).join(", ")} ${stray.length === 1 ? "is" : "are"} ignored. ` +
      `Filters go under \`filters\`, e.g. ${fn}({ filters: { ${stray[0]}: … } }).`
  );
}
