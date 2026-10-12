import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Named .mts so the registry typecheck (which has no Node types) skips it.
export default defineConfig({
  resolve: {
    alias: {
      // react-native ships Flow-typed source Vite cannot parse. Nothing under
      // test needs its runtime, only its exported component identities.
      "react-native": path.resolve(dirname, "tests/react-native-stub.ts"),
    },
  },
  test: {
    // `node`: the suites here cover pure functions that return a React
    // element tree, which is asserted on directly rather than rendered.
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
