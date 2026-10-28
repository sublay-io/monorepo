import { defineConfig } from "tsup";

// One bundled file per format, so Node can load the package with both
// `require()` and `import` (see the `exports` map in package.json):
//   dist/index.js   CommonJS   + dist/index.d.ts
//   dist/index.mjs  ES module  + dist/index.d.mts
//
// Every package in `dependencies` and `peerDependencies` (react, react-redux,
// @reduxjs/toolkit, axios, socket.io-client, lodash, ...) is left as an import
// and never copied into the bundle: tsup marks them external by default,
// subpaths such as `react/jsx-runtime` included.
export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["cjs", "esm"],
  tsconfig: "tsconfig.build.json",
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2020",
});
