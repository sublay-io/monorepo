import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeUser } from "../../test-utils";
import useSearchUsers from "./useSearchUsers";
import type { UserSearchResult } from "./useSearchUsers";

afterEach(() => {
  resetAxiosMocks();
});

describe("useSearchUsers", () => {
  it("searches users and stores the results", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useSearchUsers());

    const results: UserSearchResult[] = [{ similarity: 0.8, record: makeUser() }];
    axiosPrivate.mockResponse("post", results);

    await act(async () => {
      await result.current.search({ query: "alice", limit: 5 });
    });

    expect(result.current.results).toEqual(results);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/search/users");
    expect(call.body).toEqual({ query: "alice", limit: 5 });
  });

  it("sets an error and stops loading when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useSearchUsers());

    axiosPrivate.mockError("post", 500, { error: "Search failed" });

    await act(async () => {
      await result.current.search({ query: "alice" });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error?.message).toContain("Search failed");
  });

  it("does not call the API for a blank query", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useSearchUsers());

    await act(async () => {
      await result.current.search({ query: "" });
    });

    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });

  it("reset() clears results and error", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useSearchUsers());

    axiosPrivate.mockResponse("post", [{ similarity: 0.5, record: makeUser() }]);

    await act(async () => {
      await result.current.search({ query: "alice" });
    });
    expect(result.current.results).toHaveLength(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.results).toEqual([]);
  });
});
