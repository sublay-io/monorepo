import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

const coreSource = fileURLToPath(new URL("./src/index.ts", import.meta.url));
const reactNativeStub = fileURLToPath(
  new URL("./src/test-utils/reactNativeStub.tsx", import.meta.url),
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Only for src/registry/*.test.tsx, which load registry component hooks
    // (../../registry). Those import the SDK as `@sublay/react-js` /
    // `@sublay/react-native`; pointing both at this package's source runs
    // them against the same core the test harness mocks, and needs no build.
    // The native section components also import `react-native` itself, which
    // this package doesn't depend on: a stub of the few layout components
    // they use.
    alias: [
      { find: "@sublay/react-js", replacement: coreSource },
      { find: "@sublay/react-native", replacement: coreSource },
      { find: /^react-native$/, replacement: reactNativeStub },
    ],
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
