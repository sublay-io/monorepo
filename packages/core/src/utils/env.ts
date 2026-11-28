// Build-mode detection, for every platform the SDK runs on.
//
// Both checks read `process.env.NODE_ENV` written out literally: bundlers
// (Vite, webpack, Next.js, Metro) replace that exact text with a string at
// build time, so it works in browser bundles where no `process` object exists.
// A guard such as `typeof process !== "undefined"` would be false there and
// hide the value, so the read is wrapped in try/catch instead. When nothing
// replaced it and there is no `process` (an unbundled browser script), React
// Native's `__DEV__` is the fallback, and with neither the build counts as
// production.

declare const process:
  | { env?: Record<string, string | undefined> }
  | undefined;

/** `process.env.NODE_ENV` as the bundler or runtime provides it, or undefined. */
function readNodeEnv(): string | undefined {
  try {
    // The `!`s are type-only: the emitted text stays `process.env.NODE_ENV`.
    const value = process!.env!.NODE_ENV;
    return typeof value === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}

/** React Native's `__DEV__` global, when it is defined. */
function readDevGlobal(): boolean | undefined {
  const dev = (globalThis as { __DEV__?: unknown }).__DEV__;
  return typeof dev === "boolean" ? dev : undefined;
}

/**
 * True in a production build. False in development and test runs.
 *
 * The SDK shows its warnings (misuse, wasteful props, server rejections a
 * developer should fix) whenever this is false, so they also show in tests.
 * With no way to tell, the build counts as production.
 */
export function isProduction(): boolean {
  const nodeEnv = readNodeEnv();
  if (nodeEnv !== undefined) return nodeEnv === "production";
  const dev = readDevGlobal();
  if (dev !== undefined) return !dev;
  return true;
}

/**
 * True only while developing (`NODE_ENV` is `"development"`, or React Native's
 * `__DEV__` when `NODE_ENV` is unavailable). False in test runs and production.
 *
 * The SDK's debugging aids (logging failed requests, Redux DevTools) turn on
 * only when this is true.
 */
export function isDevelopment(): boolean {
  const nodeEnv = readNodeEnv();
  if (nodeEnv !== undefined) return nodeEnv === "development";
  return readDevGlobal() === true;
}
