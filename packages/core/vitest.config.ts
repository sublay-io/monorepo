import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

const coreSource = fileURLToPath(new URL("./src/index.ts", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Only for src/registry/*.test.tsx, which load registry component hooks
    // (../../registry). Those import the SDK as `@sublay/react-js` /
    // `@sublay/react-native`; pointing both at this package's source runs
    // them against the same core the test harness mocks, and needs no build.
    alias: {
      "@sublay/react-js": coreSource,
      "@sublay/react-native": coreSource,
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
