import { describe, it, expect, vi, afterEach } from "vitest";

import { buildSpaceReputationParams } from "./spaceReputationParams";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("buildSpaceReputationParams", () => {
  it("flattens a uuid + descendants into the server's param names", () => {
    expect(
      buildSpaceReputationParams({
        spaceReputation: { spaceId: "abc-123", includeDescendants: true },
      }),
    ).toEqual({
      spaceReputationId: "abc-123",
      spaceReputationDescendants: true,
    });
  });

  it("flattens `none` and `context` with no descendants", () => {
    expect(
      buildSpaceReputationParams({ spaceReputation: { spaceId: "none" } }),
    ).toEqual({ spaceReputationId: "none" });
    expect(
      buildSpaceReputationParams({ spaceReputation: { spaceId: "context" } }),
    ).toEqual({ spaceReputationId: "context" });
  });

  it("keeps an explicit includeDescendants: false", () => {
    expect(
      buildSpaceReputationParams({
        spaceReputation: { spaceId: "abc-123", includeDescendants: false },
      }),
    ).toEqual({
      spaceReputationId: "abc-123",
      spaceReputationDescendants: false,
    });
  });

  it("returns only the two flat keys, never the nested object", () => {
    const result = buildSpaceReputationParams({
      spaceReputation: { spaceId: "abc-123", includeDescendants: false },
    });
    expect(Object.keys(result).sort()).toEqual([
      "spaceReputationDescendants",
      "spaceReputationId",
    ]);
    expect(result).not.toHaveProperty("spaceReputation");
  });

  it("returns nothing when no object is given (undefined or null)", () => {
    expect(buildSpaceReputationParams({})).toEqual({});
    expect(buildSpaceReputationParams({ spaceReputation: undefined })).toEqual({});
    expect(buildSpaceReputationParams({ spaceReputation: null })).toEqual({});
  });

  it("never warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    buildSpaceReputationParams({ spaceReputation: { spaceId: "abc-123" } });
    buildSpaceReputationParams({});
    expect(warn).not.toHaveBeenCalled();
  });

  it("no longer accepts the flat props as input", () => {
    buildSpaceReputationParams({
      // @ts-expect-error — the flat names are wire params only
      spaceReputationId: "abc-123",
    });
    buildSpaceReputationParams({
      // @ts-expect-error — the flat names are wire params only
      spaceReputationDescendants: true,
    });
  });
});
