import { describe, it, expect, afterEach } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useFetchManyCommentsWrapper from "./useFetchManyCommentsWrapper";
import { makeComment } from "./testHelpers";
import type { CursorPaginatedResponse } from "../../interfaces/PaginatedResponse";
import type { Comment } from "../../interfaces/models/Comment";

afterEach(() => {
  resetAxiosMocks();
});

function makePage(
  comments: Comment[],
  nextCursor: string | null,
): CursorPaginatedResponse<Comment> {
  return { data: comments, pagination: { nextCursor, hasMore: nextCursor !== null } };
}

describe("useFetchManyCommentsWrapper", () => {
  it("fetches the first page on mount and continues from the cursor on loadMore", async () => {
    const firstComment = makeComment({ id: "comment-1" });
    const secondComment = makeComment({ id: "comment-2" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyCommentsWrapper({ entityId: "entity-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([firstComment], "cursor-2")),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.comments).toEqual([firstComment]);
    expect(result.current.hasMore).toBe(true);

    axiosPrivate.mockResponse("get", makePage([secondComment], null));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.hasMore).toBe(false);
    expect(result.current.comments).toEqual([firstComment, secondComment]);

    const calls = axiosPrivate.calls("get");
    expect(calls).toHaveLength(2);
    expect(calls[0].config?.params).toEqual({
      entityId: "entity-1",
      limit: 10,
      sortBy: "createdAt",
      sortDir: "desc",
    });
    expect(calls[1].config?.params).toMatchObject({
      entityId: "entity-1",
      cursor: "cursor-2",
    });
  });

  it("passes the reply params through and returns nested replies as delivered", async () => {
    const nested = makeComment({
      id: "c1",
      replies: makePage([makeComment({ id: "r1", parentId: "c1" })], "more"),
    });
    const { result, axiosPrivate } = renderHookWithAxios(
      () =>
        useFetchManyCommentsWrapper({
          entityId: "entity-1",
          defaultSortBy: "top",
          defaultSortByReaction: "love",
          replyDepth: 1,
          replyLimit: 2,
          replySortBy: "createdAt",
          replySortDir: "asc",
          include: ["user", "grants"],
        }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([nested], null)),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.comments[0].replies?.data[0].id).toBe("r1");
    expect(axiosPrivate.calls("get")[0].config?.params).toEqual({
      entityId: "entity-1",
      limit: 10,
      sortBy: "top",
      sortDir: "desc",
      sortByReaction: "love",
      replyDepth: 1,
      replyLimit: 2,
      replySortBy: "createdAt",
      replySortDir: "asc",
      include: "user,grants",
    });
  });

  it("lists a comment's direct replies by parentId", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyCommentsWrapper({ parentId: "c1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([], null)),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(axiosPrivate.calls("get")[0].config?.params).toMatchObject({ parentId: "c1" });
    expect(axiosPrivate.calls("get")[0].config?.params).not.toHaveProperty("entityId");
  });

  it("does not fetch when no entity or parent ID is given", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchManyCommentsWrapper({}),
    );

    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.loading).toBe(true);
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("surfaces a failure in error without throwing", async () => {
    const { result } = renderHookWithAxios(
      () => useFetchManyCommentsWrapper({ entityId: "entity-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockError("get", 500, { message: "Internal error" }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.comments).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("resets to the first page when the sort changes", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyCommentsWrapper({ entityId: "entity-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([makeComment({ id: "a" })], "c2")),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockResponse("get", makePage([makeComment({ id: "b" })], null));
    act(() => {
      result.current.setSortBy("controversial");
    });
    await waitFor(() => expect(result.current.comments.map((c) => c.id)).toEqual(["b"]));
    const params = axiosPrivate.calls("get")[1].config?.params;
    expect(params).toMatchObject({ sortBy: "controversial" });
    expect(params).not.toHaveProperty("cursor");
  });

  it("drops replySortByReaction when the effective reply sort isn't top", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () =>
        useFetchManyCommentsWrapper({
          entityId: "entity-1",
          defaultSortBy: "top",
          replyDepth: 1,
          replySortByReaction: "love",
        }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([], null)),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(axiosPrivate.calls("get")[0].config?.params).toMatchObject({
      replySortByReaction: "love",
    });

    axiosPrivate.mockResponse("get", makePage([], null));
    act(() => {
      result.current.setSortBy("createdAt");
    });
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(2));
    expect(axiosPrivate.calls("get")[1].config?.params).not.toHaveProperty(
      "replySortByReaction",
    );
  });

  it("changing sortByReaction while not sorting by top doesn't refetch", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyCommentsWrapper({ entityId: "entity-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([makeComment({ id: "c1" })], null)),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.setSortByReaction("like");
    });
    await new Promise((r) => setTimeout(r, 30));
    expect(axiosPrivate.calls("get")).toHaveLength(1);
    expect(result.current.comments.map((c) => c.id)).toEqual(["c1"]);
  });
});
