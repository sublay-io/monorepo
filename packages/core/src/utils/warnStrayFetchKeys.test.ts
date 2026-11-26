import { describe, it, expect, vi, afterEach } from "vitest";

import { warnStrayFetchKeys } from "./warnStrayFetchKeys";

const KEYS = ["filters", "config", "options"] as const;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("warnStrayFetchKeys", () => {
  it("warns about keys outside the groups", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnStrayFetchKeys("fetchSpaces", { sortBy: "createdAt" }, KEYS);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"sortBy"'));
  });

  it("warns about more than one argument", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnStrayFetchKeys("fetchWorkspaces", {}, KEYS, 2);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("got 2 arguments"));
  });

  it("is silent for one object of known groups, and in production", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnStrayFetchKeys("fetchSpaces", { filters: {}, config: {} }, KEYS);
    warnStrayFetchKeys("fetchSpaces", undefined, KEYS);
    vi.stubEnv("NODE_ENV", "production");
    warnStrayFetchKeys("fetchSpaces", { sortBy: "x" }, KEYS, 3);
    expect(warn).not.toHaveBeenCalled();
  });
});
