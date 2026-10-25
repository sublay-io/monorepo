import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEntity } from "../../test-utils";
import useSearchContent from "./useSearchContent";
import type { ContentSearchResult } from "./useSearchContent";

afterEach(() => {
  resetAxiosMocks();
});

describe("useSearchContent", () => {
  it("searches content and stores the results", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useSearchContent());

    const results: ContentSearchResult[] = [
      { sourceType: "entity", similarity: 0.92, record: makeEntity() },
    ];
    axiosPrivate.mockResponse("post", results);

    await act(async () => {
      await result.current.search({ query: "hello" });
    });

    expect(result.current.results).toEqual(results);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/search/content");
    expect(call.body).toMatchObject({ query: "hello" });
  });

  it("sends sourceTypes, spaceId, includeChildSpaces, conversationId and the spaceReputation options in the body", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useSearchContent());

    axiosPrivate.mockResponse("post", []);

    await act(async () => {
      await result.current.search({
        query: "hello",
        sourceTypes: ["entity", "comment"],
        spaceId: "space-1",
        includeChildSpaces: true,
        conversationId: "conversation-1",
        limit: 5,
        spaceReputationId: "context",
      });
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.body).toMatchObject({
      sourceTypes: ["entity", "comment"],
      spaceId: "space-1",
      includeChildSpaces: true,
      conversationId: "conversation-1",
      limit: 5,
      spaceReputationId: "context",
    });
    expect(call.config).toBeUndefined();
  });

  it("sets an error and stops loading when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useSearchContent());

    axiosPrivate.mockError("post", 500, { error: "Search failed" });

    await act(async () => {
      await result.current.search({ query: "hello" });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toContain("Search failed");
  });

  it("does not call the API for a blank/whitespace-only query", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useSearchContent());

    await act(async () => {
      await result.current.search({ query: "   " });
    });

    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });

  it("reset() clears results and error", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useSearchContent());

    axiosPrivate.mockResponse("post", [
      { sourceType: "entity", similarity: 0.5, record: makeEntity() },
    ]);

    await act(async () => {
      await result.current.search({ query: "hello" });
    });
    expect(result.current.results).toHaveLength(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
