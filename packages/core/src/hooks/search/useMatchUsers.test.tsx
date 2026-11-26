import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeAuthUser,
} from "../../test-utils";
import useMatchUsers from "./useMatchUsers";
import type { UserMatchResult } from "./useMatchUsers";

afterEach(() => {
  resetAxiosMocks();
});

function makeMatch(overrides: Partial<UserMatchResult> = {}): UserMatchResult {
  return {
    user: makeAuthUser() as unknown as UserMatchResult["user"],
    score: 1.23,
    matchedFacets: [
      {
        similarity: 0.7,
        askerFacet: { id: "af1", hotness: 4 },
        candidateFacet: { id: "cf1", hotness: 4 },
      },
    ],
    ...overrides,
  };
}

describe("useMatchUsers", () => {
  it("posts to /match/users and stores the { results } envelope", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useMatchUsers());

    const results = [makeMatch()];
    // The server returns the { results: [...] } envelope; the hook reads
    // response.data.results.
    axiosPrivate.mockResponse("post", { results });

    await act(async () => {
      await result.current.match({ mode: "passive", limit: 5 });
    });

    expect(result.current.results).toEqual(results);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/match/users");
    // Body carries the mode + shaping fields (undefined for the ones not passed).
    expect(call.body).toMatchObject({ mode: "passive", limit: 5 });
  });

  it("shapes the directed body (mode + query + flags)", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useMatchUsers());
    axiosPrivate.mockResponse("post", { results: [] });

    await act(async () => {
      await result.current.match({
        mode: "directed",
        query: "biotech",
        limit: 10,
        spaceId: "space-1",
        includeChildSpaces: true,
        includeSampleContent: true,
        excludeSelf: false,
      });
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/match/users");
    expect(call.body).toEqual({
      mode: "directed",
      query: "biotech",
      limit: 10,
      spaceId: "space-1",
      includeChildSpaces: true,
      includeSampleContent: true,
      excludeSelf: false,
    });
  });

  it("does not call the API for a directed match with a blank query", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useMatchUsers());

    await act(async () => {
      await result.current.match({ mode: "directed", query: "   " });
    });

    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });

  it("sets an error and stops loading when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useMatchUsers());

    axiosPrivate.mockError("post", 403, {
      error: "Interest matching is not enabled for this project",
    });

    await act(async () => {
      await result.current.match({ mode: "passive" });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error?.message).toContain("not enabled");
  });

  it("reset() clears results and error", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useMatchUsers());

    axiosPrivate.mockResponse("post", { results: [makeMatch()] });

    await act(async () => {
      await result.current.match({ mode: "passive" });
    });
    expect(result.current.results).toHaveLength(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
