import { defineConfig } from "tsup";

// One bundled file per format, so Node can load the package with both
// `require()` and `import` (see the `exports` map in package.json):
//   dist/index.js   CommonJS   + dist/index.d.ts
//   dist/index.mjs  ES module  + dist/index.d.mts
//
// `@sublay/core` and every peer (react, react-dom, react-redux,
// @reduxjs/toolkit) stay imports: tsup never copies a package listed in
// `dependencies` or `peerDependencies` into the bundle. That keeps a single
// copy of core — its React contexts and Redux store — in the app.
export default defineConfig({
  entry: { index: "src/index.tsx" },
  format: ["cjs", "esm"],
  tsconfig: "tsconfig.build.json",
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2020",
});
