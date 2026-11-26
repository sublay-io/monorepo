import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeSpace } from "../../test-utils";
import useSearchSpaces from "./useSearchSpaces";
import type { SpaceSearchResult } from "./useSearchSpaces";

afterEach(() => {
  resetAxiosMocks();
});

describe("useSearchSpaces", () => {
  it("searches spaces and stores the results", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useSearchSpaces());

    const results: SpaceSearchResult[] = [{ similarity: 0.75, record: makeSpace() }];
    axiosPrivate.mockResponse("post", results);

    await act(async () => {
      await result.current.search({ query: "design", limit: 10 });
    });

    expect(result.current.results).toEqual(results);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/search/spaces");
    expect(call.body).toEqual({ query: "design", limit: 10 });
  });

  it("sets an error and stops loading when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useSearchSpaces());

    axiosPrivate.mockError("post", 500, { error: "Search failed" });

    await act(async () => {
      await result.current.search({ query: "design" });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error?.message).toContain("Search failed");
  });

  it("does not call the API for a blank query", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useSearchSpaces());

    await act(async () => {
      await result.current.search({ query: "  " });
    });

    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });

  it("reset() clears results and error", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useSearchSpaces());

    axiosPrivate.mockResponse("post", [{ similarity: 0.5, record: makeSpace() }]);

    await act(async () => {
      await result.current.search({ query: "design" });
    });
    expect(result.current.results).toHaveLength(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.results).toEqual([]);
  });
});
