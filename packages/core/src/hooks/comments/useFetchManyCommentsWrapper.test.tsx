import { describe, it, expect, afterEach, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import { axiosPrivate as axiosPrivateInstance } from "../../config/axios";
import useFetchManyCommentsWrapper from "./useFetchManyCommentsWrapper";
import { makeComment } from "./testHelpers";
import type { CursorPaginatedResponse } from "../../interfaces/PaginatedResponse";
import type { Comment } from "../../interfaces/models/Comment";

afterEach(() => {
  resetAxiosMocks();
  vi.restoreAllMocks();
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
      replies: makePage([makeComment({ id: "r1", parentCommentId: "c1" })], "more"),
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

  it("lists a comment's direct replies by parentCommentId", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyCommentsWrapper({ parentCommentId: "c1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([], null)),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(axiosPrivate.calls("get")[0].config?.params).toMatchObject({ parentCommentId: "c1" });
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

  it("clears error when the retry starts, and keeps what was loaded", async () => {
    const firstComment = makeComment({ id: "comment-1" });
    const secondComment = makeComment({ id: "comment-2" });
    const respond = (data: unknown) =>
      Promise.resolve({ data, status: 200, statusText: "OK", headers: {}, config: {} } as any);
    let releaseRetry!: () => void;
    const retryGate = new Promise<void>((r) => (releaseRetry = r));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const get = vi
      .spyOn(axiosPrivateInstance, "get")
      .mockImplementationOnce(() => respond(makePage([firstComment], "cursor-2")))
      .mockImplementationOnce(() => Promise.reject(new Error("boom")))
      .mockImplementationOnce(() =>
        retryGate.then(() => respond(makePage([secondComment], null))),
      );

    const { result } = renderHookWithAxios(() =>
      useFetchManyCommentsWrapper({ entityId: "entity-1" }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();

    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.comments).toEqual([firstComment]);

    // The retry is in flight: the old failure is gone.
    let retry!: Promise<void>;
    act(() => {
      retry = result.current.loadMore();
    });
    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(result.current.error).toBeNull();
    expect(result.current.comments).toEqual([firstComment]);

    releaseRetry();
    await act(async () => {
      await retry;
    });
    expect(result.current.error).toBeNull();
    expect(result.current.comments).toEqual([firstComment, secondComment]);
    // The retry re-sent the page that failed.
    expect(get.mock.calls[2][1]?.params).toMatchObject({ cursor: "cursor-2" });
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

describe("useFetchManyCommentsWrapper — the target going away", () => {
  it("clears the previous target's comments when entityId/parentCommentId are removed", async () => {
    const { result, rerender } = renderHookWithAxios(
      (p: { entityId: string | null }) => useFetchManyCommentsWrapper(p),
      {
        initialProps: { entityId: "entity-1" as string | null },
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([makeComment({ id: "comment-1" })], "next")),
      },
    );
    await waitFor(() => expect(result.current.comments).toHaveLength(1));

    rerender({ entityId: null });
    await waitFor(() => expect(result.current.comments).toEqual([]));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("doesn't leave loading stuck when the target is removed mid-load, and drops the late response", async () => {
    let resolveGet!: (v: unknown) => void;
    const { result, rerender } = renderHookWithAxios(
      (p: { entityId: string | null }) => useFetchManyCommentsWrapper(p),
      {
        initialProps: { entityId: "entity-1" as string | null },
        beforeRender: () => {
          vi.spyOn(axiosPrivateInstance, "get").mockImplementationOnce(
            () => new Promise((resolve) => { resolveGet = resolve; }) as never,
          );
        },
      },
    );
    await waitFor(() => expect(resolveGet).toBeTypeOf("function"));
    expect(result.current.loading).toBe(true);

    rerender({ entityId: null });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      resolveGet({ data: makePage([makeComment({ id: "late" })], null), status: 200 });
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(result.current.comments).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});

describe("useFetchManyCommentsWrapper — the list contract", () => {
  it("drops a page that lands after the entity changed", async () => {
    let releaseStale!: (v: unknown) => void;
    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (p: { entityId: string }) => useFetchManyCommentsWrapper(p),
      {
        initialProps: { entityId: "entity-1" },
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([makeComment({ id: "e1-a" })], "c2")),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.mocked(axiosPrivateInstance.get).mockImplementationOnce(
      () => new Promise((resolve) => { releaseStale = resolve; }) as never,
    );
    act(() => {
      result.current.loadMore();
    });
    axiosPrivate.mockResponse("get", makePage([makeComment({ id: "e2-a" })], null));
    rerender({ entityId: "entity-2" });
    await waitFor(() => expect(result.current.comments.map((c) => c.id)).toEqual(["e2-a"]));

    await act(async () => {
      releaseStale({ data: makePage([makeComment({ id: "e1-b" })], null), status: 200 });
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.current.comments.map((c) => c.id)).toEqual(["e2-a"]);
    expect(axiosPrivate.calls("get")[2].config?.params).toMatchObject({ entityId: "entity-2" });
    expect(axiosPrivate.calls("get")[2].config?.params).not.toHaveProperty("cursor");
  });

  it("retries a failed first page as the first page (no cursor)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyCommentsWrapper({ entityId: "entity-1" }),
      { beforeRender: ({ axiosPrivate }) => axiosPrivate.mockError("get", 500) },
    );
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.hasMore).toBe(true);

    axiosPrivate.mockResponse("get", makePage([makeComment({ id: "c1" })], null));
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.comments.map((c) => c.id)).toEqual(["c1"]);
    expect(axiosPrivate.calls("get")[1].config?.params).not.toHaveProperty("cursor");
  });

  it("advances exactly one page on two loadMore calls in the same tick", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyCommentsWrapper({ entityId: "entity-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([makeComment({ id: "c1" })], "c2")),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockResponse("get", makePage([makeComment({ id: "c2" })], "c3"));
    await act(async () => {
      await Promise.all([result.current.loadMore(), result.current.loadMore()]);
    });
    expect(axiosPrivate.calls("get")).toHaveLength(2);
    expect(result.current.comments.map((c) => c.id)).toEqual(["c1", "c2"]);
  });

  it("refetch reloads the first page with the current sort and replaces the list", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyCommentsWrapper({ entityId: "entity-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([makeComment({ id: "c1" })], "c2")),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    axiosPrivate.mockResponse("get", makePage([makeComment({ id: "c2" })], "c3"));
    await act(async () => {
      await result.current.loadMore();
    });
    axiosPrivate.mockResponse("get", makePage([makeComment({ id: "old-1" })], "x"));
    act(() => result.current.setSortDir("asc"));
    await waitFor(() => expect(result.current.comments.map((c) => c.id)).toEqual(["old-1"]));

    axiosPrivate.mockResponse("get", makePage([makeComment({ id: "old-1b" })], null));
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.comments.map((c) => c.id)).toEqual(["old-1b"]);
    expect(result.current.hasMore).toBe(false);
    const calls = axiosPrivate.calls("get");
    const last = calls[calls.length - 1].config?.params;
    expect(last).toMatchObject({ entityId: "entity-1", sortDir: "asc" });
    expect(last).not.toHaveProperty("cursor");
  });

  it("loadMore and refetch never reject", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyCommentsWrapper({ entityId: "entity-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([makeComment({ id: "c1" })], "c2")),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    axiosPrivate.mockError("get", 500);
    await expect(result.current.loadMore()).resolves.toBeUndefined();
    axiosPrivate.mockNetworkError("get");
    await expect(result.current.refetch()).resolves.toBeUndefined();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.comments.map((c) => c.id)).toEqual(["c1"]);
  });
});
