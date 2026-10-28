import { defineConfig } from "tsup";

// One bundled file per entry and format, so Node can load the package with
// both `require()` and `import` (see the `exports` map in package.json):
//   dist/index.js  / dist/index.mjs   the SDK          (+ .d.ts / .d.mts)
//   dist/push.js   / dist/push.mjs    `<pkg>/push`     (+ .d.ts / .d.mts)
//
// The push adapter is its own entry so that importing the SDK never loads the
// push library: an app that doesn't use push doesn't install it.
//
// `@sublay/core` and every peer stay imports: tsup never copies a package
// listed in `dependencies` or `peerDependencies` into the bundle. That keeps a
// single copy of core — its React contexts and Redux store — in the app.
export default defineConfig({
  entry: { index: "src/index.tsx", push: "src/push.ts" },
  format: ["cjs", "esm"],
  tsconfig: "tsconfig.build.json",
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2020",
  // The push adapter loads expo-notifications with `import()` (see
  // src/PushTokenAdapter.ts). In the CommonJS build that becomes a
  // `require()` inside a promise, as tsc's CommonJS output had it: a test
  // runner such as Jest runs CommonJS without ES module support, and a bare
  // `import()` there throws.
  esbuildOptions(options, context) {
    if (context.format === "cjs") options.supported = { "dynamic-import": false };
  },
});
