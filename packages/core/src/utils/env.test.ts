import { describe, it, expect, afterEach, vi } from "vitest";
import { isDevelopment, isProduction } from "./env";

describe("build-mode detection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("follows NODE_ENV", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isDevelopment()).toBe(true);
    expect(isProduction()).toBe(false);

    // Tests: warnings on (not production), debugging aids off.
    vi.stubEnv("NODE_ENV", "test");
    expect(isDevelopment()).toBe(false);
    expect(isProduction()).toBe(false);

    vi.stubEnv("NODE_ENV", "production");
    expect(isDevelopment()).toBe(false);
    expect(isProduction()).toBe(true);
  });

  it("prefers NODE_ENV over React Native's __DEV__", () => {
    // React Native's test preset sets __DEV__ to true while NODE_ENV is "test".
    vi.stubEnv("NODE_ENV", "test");
    vi.stubGlobal("__DEV__", true);
    expect(isDevelopment()).toBe(false);
    expect(isProduction()).toBe(false);
  });

  it("falls back to __DEV__, then to production, when NODE_ENV is unavailable", () => {
    vi.stubGlobal("process", undefined);

    vi.stubGlobal("__DEV__", true);
    expect(isDevelopment()).toBe(true);
    expect(isProduction()).toBe(false);

    vi.stubGlobal("__DEV__", false);
    expect(isDevelopment()).toBe(false);
    expect(isProduction()).toBe(true);

    vi.stubGlobal("__DEV__", undefined);
    expect(isDevelopment()).toBe(false);
    expect(isProduction()).toBe(true);
  });
});
