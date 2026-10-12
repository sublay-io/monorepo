import { describe, it, expect, afterEach, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useEntityComments from "./useEntityComments";
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("useEntityComments", () => {
  it("loads top-level comments and continues from the cursor on loadMore", async () => {
    const rootComment = makeComment({ id: "comment-1" });
    const secondComment = makeComment({ id: "comment-2" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useEntityComments({ entityId: "entity-1", include: "user" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([rootComment], "cursor-2")),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.comments).toEqual([rootComment]);
    expect(result.current.hasMore).toBe(true);

    axiosPrivate.mockResponse("get", makePage([secondComment], null));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.hasMore).toBe(false);
    expect(result.current.comments.map((c) => c.id)).toEqual([
      "comment-1",
      "comment-2",
    ]);

    const calls = axiosPrivate.calls("get");
    expect(calls[0].config?.params).toEqual({
      entityId: "entity-1",
      include: "user",
      limit: 10,
      sortBy: "createdAt",
      sortDir: "desc",
    });
    expect(calls[1].config?.params).toMatchObject({ cursor: "cursor-2" });
    expect(calls[1].config?.params).not.toHaveProperty("page");
  });

  it("de-duplicates a comment that re-arrives on a later page", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useEntityComments({ entityId: "entity-1", defaultSortBy: "top" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse(
            "get",
            makePage([makeComment({ id: "a" }), makeComment({ id: "b" })], "c2"),
          ),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockResponse(
      "get",
      makePage([makeComment({ id: "b" }), makeComment({ id: "c" })], null),
    );
    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.comments.map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  it("sends replyDepth on every top-level page and exposes nested replies via getComment without the nested copy", async () => {
    const nested = makeComment({
      id: "c1",
      repliesCount: 1,
      replies: makePage([makeComment({ id: "r1", parentId: "c1" })], null),
    });
    const { result, axiosPrivate } = renderHookWithAxios(
      () =>
        useEntityComments({
          entityId: "entity-1",
          replyDepth: 2,
          replyLimit: 3,
          replySortBy: "createdAt",
          replySortDir: "asc",
        }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([nested], "next")),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.getComment("c1")).not.toHaveProperty("replies");
    expect(result.current.getComment("r1")?.parentId).toBe("c1");
    expect(result.current.getComment("missing")).toBeUndefined();

    axiosPrivate.mockResponse("get", makePage([], null));
    await act(async () => {
      await result.current.loadMore();
    });

    for (const call of axiosPrivate.calls("get")) {
      expect(call.config?.params).toMatchObject({
        replyDepth: 2,
        replyLimit: 3,
        replySortBy: "createdAt",
        replySortDir: "asc",
      });
    }
  });

  it("only sends sortByReaction with sortBy top", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () =>
        useEntityComments({
          entityId: "entity-1",
          defaultSortBy: "top",
          defaultSortByReaction: "love",
        }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([], null)),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(axiosPrivate.calls("get")[0].config?.params).toMatchObject({
      sortBy: "top",
      sortByReaction: "love",
    });

    axiosPrivate.mockResponse("get", makePage([], null));
    act(() => {
      result.current.setSortBy("createdAt");
    });
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(2));
    expect(axiosPrivate.calls("get")[1].config?.params).not.toHaveProperty(
      "sortByReaction",
    );
  });

  it("keeps the default sortByReaction across a switch away from top and back", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () =>
        useEntityComments({
          entityId: "entity-1",
          defaultSortBy: "top",
          defaultSortByReaction: "like",
        }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([], null)),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockResponse("get", makePage([], null));
    act(() => {
      result.current.setSortBy("createdAt");
    });
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(2));

    axiosPrivate.mockResponse("get", makePage([], null));
    act(() => {
      result.current.setSortBy("top");
    });
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(3));

    const params = axiosPrivate.calls("get").map((c) => c.config?.params);
    expect(params[0]).toMatchObject({ sortBy: "top", sortByReaction: "like" });
    expect(params[1]).not.toHaveProperty("sortByReaction");
    expect(params[2]).toMatchObject({ sortBy: "top", sortByReaction: "like" });
  });

  it("loadMore is a no-op while loading or when there's nothing more", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useEntityComments({ entityId: "entity-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([makeComment()], null)),
      },
    );
    // While the first page is in flight.
    await act(async () => {
      await result.current.loadMore();
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    // hasMore is false now.
    await act(async () => {
      await result.current.loadMore();
    });
    expect(axiosPrivate.calls("get")).toHaveLength(1);
  });

  it("sets error on failure; loadMore never throws and a later success clears it", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useEntityComments({ entityId: "entity-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([makeComment()], "c2")),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();

    axiosPrivate.mockError("get", 500, { message: "Internal error" });
    await act(async () => {
      await expect(result.current.loadMore()).resolves.toBeUndefined();
    });
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.hasMore).toBe(true);

    axiosPrivate.mockResponse("get", makePage([], null));
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.error).toBeNull();
    // The failed page didn't move the cursor.
    expect(axiosPrivate.calls("get")[2].config?.params).toMatchObject({ cursor: "c2" });
  });

  it("retries a failed first page with loadMore and clears error when the retry starts", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useEntityComments({ entityId: "entity-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockError("get", 500, { message: "Internal error" }),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.comments).toEqual([]);
    expect(result.current.hasMore).toBe(true);

    const retry = deferred<{ data: CursorPaginatedResponse<Comment> }>();
    vi.mocked(axiosPrivate.instance.get).mockReturnValueOnce(retry.promise as never);
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.loadMore();
    });
    // Cleared as soon as the retry starts.
    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(result.current.error).toBeNull();

    const comment = makeComment({ id: "comment-1" });
    await act(async () => {
      retry.resolve({ data: makePage([comment], null) });
      await pending;
    });
    expect(result.current.error).toBeNull();
    expect(result.current.comments).toEqual([comment]);
    expect(result.current.hasMore).toBe(false);
    // The retry asked for the first page again.
    expect(axiosPrivate.calls("get")).toHaveLength(2);
    expect(axiosPrivate.calls("get")[1].config?.params?.cursor ?? null).toBeNull();
  });

  it("drops a response from before a sort change", async () => {
    const slow = deferred<{ data: CursorPaginatedResponse<Comment> }>();
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useEntityComments({ entityId: "entity-1" }),
      {
        beforeRender: ({ axiosPrivate }) => {
          vi.mocked(axiosPrivate.instance.get).mockReturnValueOnce(slow.promise as never);
        },
      },
    );

    axiosPrivate.mockResponse("get", makePage([makeComment({ id: "fresh" })], null));
    act(() => {
      result.current.setSortBy("top");
    });
    await waitFor(() => expect(result.current.comments.map((c) => c.id)).toEqual(["fresh"]));

    await act(async () => {
      slow.resolve({ data: makePage([makeComment({ id: "stale" })], "old-cursor") });
      await slow.promise;
    });

    expect(result.current.comments.map((c) => c.id)).toEqual(["fresh"]);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it("does not fetch when there is no entity ID", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useEntityComments({ entityId: null }),
    );

    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("drops replySortByReaction once the effective reply sort is no longer top", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () =>
        useEntityComments({
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

  it("changing sortByReaction while not sorting by top neither refetches nor drops loaded replies", async () => {
    const reply = makeComment({ id: "r1", parentId: "c1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useEntityComments({ entityId: "entity-1", defaultSortBy: "createdAt", replyDepth: 1 }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse(
            "get",
            makePage([makeComment({ id: "c1", repliesCount: 1, replies: makePage([reply], null) })], null),
          ),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.getComment("r1")).toBeDefined();

    act(() => {
      result.current.setSortByReaction("like");
    });
    await new Promise((r) => setTimeout(r, 30));
    expect(axiosPrivate.calls("get")).toHaveLength(1);
    expect(result.current.getComment("r1")).toBeDefined();
    expect(result.current.sortByReaction).toBe("like");

    // It applies once the sort is top.
    axiosPrivate.mockResponse("get", makePage([], null));
    act(() => {
      result.current.setSortBy("top");
    });
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(2));
    expect(axiosPrivate.calls("get")[1].config?.params).toMatchObject({
      sortBy: "top",
      sortByReaction: "like",
    });
  });
});

describe("useEntityComments — the entity changing", () => {
  it("never shows the previous entity's comments under the new entityId, and drops them when it is removed", async () => {
    const seen: { entityId: string | null; ids: string[]; loading: boolean }[] = [];
    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (p: { entityId: string | null }) => {
        const values = useEntityComments(p);
        seen.push({
          entityId: p.entityId,
          ids: values.comments.map((c) => c.id),
          loading: values.loading,
        });
        return values;
      },
      {
        initialProps: { entityId: "entity-A" as string | null },
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([makeComment({ id: "a1" })], null)),
      },
    );
    await waitFor(() => expect(result.current.comments.map((c) => c.id)).toEqual(["a1"]));
    expect(result.current.newComments).toEqual([]);

    axiosPrivate.mockResponse("get", makePage([makeComment({ id: "b1" })], null));
    rerender({ entityId: "entity-B" });
    expect(result.current.comments).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.getComment("a1")).toBeUndefined();
    await waitFor(() => expect(result.current.comments.map((c) => c.id)).toEqual(["b1"]));
    for (const render of seen) {
      if (render.entityId === "entity-B") expect(render.ids).not.toContain("a1");
    }

    rerender({ entityId: null });
    expect(result.current.comments).toEqual([]);
    expect(result.current.getComment("b1")).toBeUndefined();
  });
});
