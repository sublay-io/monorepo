import { describe, it, expect, afterEach, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { resetAxiosMocks } from "../../test-utils";
import { renderWithCommentSection, makeComment, makeEntity } from "./testHelpers";
import useReplies from "./useReplies";
import useCommentSection from "./useCommentSection";
import type { CursorPaginatedResponse } from "../../interfaces/PaginatedResponse";
import type { Comment } from "../../interfaces/models/Comment";
import type { CommentSectionProviderProps } from "../../context/comment-section-context";

afterEach(() => {
  resetAxiosMocks();
});

const C1 = "11111111-1111-4111-8111-111111111111";
const R1 = "22222222-2222-4222-8222-222222222222";

function makePage(
  comments: Comment[],
  nextCursor: string | null,
): CursorPaginatedResponse<Comment> {
  return { data: comments, pagination: { nextCursor, hasMore: nextCursor !== null } };
}

/** Mounts a real section whose first (top-level) page is `topLevel`. */
function renderReplies(
  options: {
    topLevel: Comment[];
    providerProps?: Partial<Omit<CommentSectionProviderProps, "children">>;
    repliesProps?: Partial<Parameters<typeof useReplies>[0]>;
    commentId?: string;
  },
) {
  const entity = makeEntity({ id: "entity-1" });
  const rendered = renderWithCommentSection(
    () => ({
      replies: useReplies({ commentId: options.commentId ?? C1, ...options.repliesProps }),
      section: useCommentSection(),
    }),
    {
      providerProps: { entity, ...options.providerProps },
      beforeRender: ({ axiosPrivate }) =>
        axiosPrivate.mockResponse("get", makePage(options.topLevel, null)),
    },
  );
  return rendered;
}

async function settled(result: { current: { section: { loading?: boolean } } }) {
  await waitFor(() => expect(result.current.section.loading).toBe(false));
}

describe("useReplies", () => {
  it("never fetches on its own and exposes the comment from the store", async () => {
    const { result, axiosPrivate } = renderReplies({
      topLevel: [makeComment({ id: C1, repliesCount: 4 })],
    });
    await settled(result);

    expect(result.current.replies.comment?.id).toBe(C1);
    expect(result.current.replies.replies).toEqual([]);
    expect(result.current.replies.hasMore).toBe(true);
    // Only the section's top-level request.
    expect(axiosPrivate.calls("get")).toHaveLength(1);
  });

  it("first load of a boundary comment nests with the section's replyDepth/replyLimit", async () => {
    const { result, axiosPrivate } = renderReplies({
      topLevel: [makeComment({ id: C1, repliesCount: 4 })],
      providerProps: { replyDepth: 2, replyLimit: 3 },
    });
    await settled(result);

    axiosPrivate.mockResponse(
      "get",
      makePage([makeComment({ id: R1, parentId: C1 })], "next"),
    );
    await act(async () => {
      await result.current.replies.loadMore();
    });

    expect(axiosPrivate.calls("get")[1].config?.params).toEqual({
      parentId: C1,
      limit: 10,
      sortBy: "top",
      sortDir: "desc",
      include: "user",
      replyDepth: 2,
      replyLimit: 3,
    });
    expect(result.current.replies.replies.map((r) => r.id)).toEqual([R1]);
    expect(result.current.replies.hasMore).toBe(true);
  });

  it("without the section opt-in, the first load is a plain page", async () => {
    const { result, axiosPrivate } = renderReplies({
      topLevel: [makeComment({ id: C1, repliesCount: 4 })],
    });
    await settled(result);

    axiosPrivate.mockResponse("get", makePage([], null));
    await act(async () => {
      await result.current.replies.loadMore();
    });
    const params = axiosPrivate.calls("get")[1].config?.params;
    expect(params).not.toHaveProperty("replyDepth");
    expect(params).not.toHaveProperty("replyLimit");
  });

  it("continues after replies the section pre-loaded, without nesting or duplicates", async () => {
    const preloaded = [1, 2, 3].map((n) =>
      makeComment({ id: `pre-${n}`, parentId: C1 }),
    );
    const { result, axiosPrivate } = renderReplies({
      topLevel: [
        makeComment({ id: C1, repliesCount: 6, replies: makePage(preloaded, "after-3") }),
      ],
      providerProps: { replyDepth: 1, replyLimit: 3 },
    });
    await settled(result);
    expect(result.current.replies.replies.map((r) => r.id)).toEqual([
      "pre-1",
      "pre-2",
      "pre-3",
    ]);

    // The page overlaps with what's already loaded (vote drift): de-duplicated.
    axiosPrivate.mockResponse(
      "get",
      makePage(
        [makeComment({ id: "pre-3", parentId: C1 }), makeComment({ id: "post-4", parentId: C1 })],
        null,
      ),
    );
    await act(async () => {
      await result.current.replies.loadMore();
    });

    const params = axiosPrivate.calls("get")[1].config?.params;
    expect(params).toMatchObject({ parentId: C1, cursor: "after-3", limit: 10 });
    expect(params).not.toHaveProperty("replyDepth");
    expect(result.current.replies.replies.map((r) => r.id)).toEqual([
      "pre-1",
      "pre-2",
      "pre-3",
      "post-4",
    ]);
    expect(result.current.replies.hasMore).toBe(false);
  });

  it("later loads don't nest and continue from the stored cursor", async () => {
    const { result, axiosPrivate } = renderReplies({
      topLevel: [makeComment({ id: C1, repliesCount: 30 })],
      providerProps: { replyDepth: 2 },
    });
    await settled(result);

    axiosPrivate.mockResponse("get", makePage([makeComment({ id: R1, parentId: C1 })], "c-10"));
    await act(async () => {
      await result.current.replies.loadMore();
    });
    axiosPrivate.mockResponse("get", makePage([], null));
    await act(async () => {
      await result.current.replies.loadMore();
    });

    const second = axiosPrivate.calls("get")[2].config?.params;
    expect(second).toMatchObject({ cursor: "c-10", limit: 10 });
    expect(second).not.toHaveProperty("replyDepth");
  });

  it("lowers the inherited first-load depth to fit the 500-row budget", async () => {
    const { result, axiosPrivate } = renderReplies({
      topLevel: [makeComment({ id: C1, repliesCount: 30 })],
      providerProps: { replyDepth: 5, replyLimit: 3 },
    });
    await settled(result);

    axiosPrivate.mockResponse("get", makePage([], null));
    await act(async () => {
      await result.current.replies.loadMore();
    });
    // 10 × (1+3+9+27) = 400 fits; depth 4 would be 1210.
    expect(axiosPrivate.calls("get")[1].config?.params).toMatchObject({
      replyDepth: 3,
      replyLimit: 3,
    });
  });

  it("sends an explicit depth as-is (hook prop, then per-call override)", async () => {
    const { result, axiosPrivate } = renderReplies({
      topLevel: [makeComment({ id: C1, repliesCount: 30 })],
      providerProps: { replyDepth: 1, replyLimit: 3 },
      repliesProps: { replyDepth: 5 },
    });
    await settled(result);

    axiosPrivate.mockResponse("get", makePage([], "more"));
    await act(async () => {
      await result.current.replies.loadMore();
    });
    expect(axiosPrivate.calls("get")[1].config?.params).toMatchObject({ replyDepth: 5 });

    axiosPrivate.mockResponse("get", makePage([], null));
    await act(async () => {
      await result.current.replies.loadMore({ replyDepth: 2, limit: 25 });
    });
    expect(axiosPrivate.calls("get")[2].config?.params).toMatchObject({
      replyDepth: 2,
      limit: 25,
      cursor: "more",
    });
  });

  it("inherits the section's reply sort trio as the level sort", async () => {
    const top = renderReplies({
      topLevel: [makeComment({ id: C1, repliesCount: 3 })],
      providerProps: { defaultSortBy: "top", defaultSortByReaction: "love" },
    });
    await settled(top.result);
    top.axiosPrivate.mockResponse("get", makePage([], null));
    await act(async () => {
      await top.result.current.replies.loadMore();
    });
    expect(top.axiosPrivate.calls("get")[1].config?.params).toMatchObject({
      sortBy: "top",
      sortDir: "desc",
      sortByReaction: "love",
    });
    top.unmount();
    resetAxiosMocks();

    const custom = renderReplies({
      topLevel: [makeComment({ id: C1, repliesCount: 3 })],
      providerProps: {
        defaultSortBy: "top",
        defaultSortByReaction: "love",
        replySortBy: "createdAt",
        replySortDir: "asc",
      },
    });
    await settled(custom.result);
    custom.axiosPrivate.mockResponse("get", makePage([], null));
    await act(async () => {
      await custom.result.current.replies.loadMore();
    });
    const params = custom.axiosPrivate.calls("get")[1].config?.params;
    expect(params).toMatchObject({ sortBy: "createdAt", sortDir: "asc" });
    expect(params).not.toHaveProperty("sortByReaction");
  });

  it("surfaces a failure in error and never throws", async () => {
    const { result, axiosPrivate } = renderReplies({
      topLevel: [makeComment({ id: C1, repliesCount: 3 })],
    });
    await settled(result);

    axiosPrivate.mockError("get", 500, { message: "boom" });
    await act(async () => {
      await expect(result.current.replies.loadMore()).resolves.toBeUndefined();
    });
    expect(result.current.replies.error).toBeInstanceOf(Error);
    expect(result.current.replies.loading).toBe(false);
    expect(result.current.replies.hasMore).toBe(true);
  });

  it("retries a failed first replies load with loadMore; error clears when the retry starts", async () => {
    const { result, axiosPrivate } = renderReplies({
      topLevel: [makeComment({ id: C1, repliesCount: 3 })],
      providerProps: { replyDepth: 1, replyLimit: 2 },
    });
    await settled(result);

    axiosPrivate.mockError("get", 500, { message: "boom" });
    await act(async () => {
      await result.current.replies.loadMore();
    });
    expect(result.current.replies.error).toBeInstanceOf(Error);
    expect(result.current.replies.hasMore).toBe(true);

    let resolveRetry!: (value: unknown) => void;
    vi.mocked(axiosPrivate.instance.get).mockReturnValueOnce(
      new Promise((r) => {
        resolveRetry = r;
      }) as never,
    );
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.replies.loadMore();
    });
    await waitFor(() => expect(result.current.replies.loading).toBe(true));
    expect(result.current.replies.error).toBeNull();

    await act(async () => {
      resolveRetry({ data: makePage([makeComment({ id: R1, parentId: C1 })], null) });
      await pending;
    });
    expect(result.current.replies.error).toBeNull();
    expect(result.current.replies.replies.map((r) => r.id)).toEqual([R1]);
    expect(result.current.replies.hasMore).toBe(false);
    // Still the first load: same cursor, same nesting as the failed attempt.
    const [failed, retried] = axiosPrivate.calls("get").slice(1);
    expect(retried.config?.params).toEqual(failed.config?.params);
    expect(retried.config?.params).toMatchObject({ replyDepth: 1, replyLimit: 2 });
  });

  it("clears error when the section resets (sort change)", async () => {
    const { result, axiosPrivate } = renderReplies({
      topLevel: [makeComment({ id: C1, repliesCount: 3 })],
    });
    await settled(result);

    axiosPrivate.mockError("get", 500, { message: "boom" });
    await act(async () => {
      await result.current.replies.loadMore();
    });
    expect(result.current.replies.error).toBeInstanceOf(Error);

    axiosPrivate.mockResponse("get", makePage([makeComment({ id: C1, repliesCount: 3 })], null));
    act(() => {
      result.current.section.setSortBy!("createdAt");
    });
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(3));
    await settled(result);
    expect(result.current.replies.error).toBeNull();
    expect(result.current.replies.hasMore).toBe(true);
  });

  it("does nothing for a comment that isn't loaded, or outside a section", async () => {
    const { result, axiosPrivate } = renderReplies({
      topLevel: [],
      commentId: R1,
    });
    await settled(result);
    await act(async () => {
      await result.current.replies.loadMore();
    });
    expect(result.current.replies.comment).toBeUndefined();
    expect(result.current.replies.hasMore).toBe(false);
    expect(axiosPrivate.calls("get")).toHaveLength(1);

    const bare = renderWithCommentSection(() => useReplies({ commentId: C1 }));
    await act(async () => {
      await bare.result.current.loadMore();
    });
    expect(bare.result.current.replies).toEqual([]);
    expect(bare.axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("continues nested replies in the section's direction when only replySortBy is set", async () => {
    const { result, axiosPrivate } = renderReplies({
      topLevel: [makeComment({ id: C1, repliesCount: 3 })],
      providerProps: {
        defaultSortBy: "createdAt",
        defaultSortDir: "asc",
        replySortBy: "top",
      },
    });
    await settled(result);

    axiosPrivate.mockResponse("get", makePage([], null));
    await act(async () => {
      await result.current.replies.loadMore();
    });
    // replySortDir defaults to the section's direction.
    expect(axiosPrivate.calls("get")[1].config?.params).toMatchObject({
      sortBy: "top",
      sortDir: "asc",
    });
  });
});

describe("useReplies — one instance moved to another comment", () => {
  const A1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
  const A2 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";

  function renderSwitchable() {
    const current = { commentId: A1 };
    const entity = makeEntity({ id: "entity-1" });
    const rendered = renderWithCommentSection(
      () => ({
        replies: useReplies({ commentId: current.commentId }),
        section: useCommentSection(),
      }),
      {
        providerProps: { entity },
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse(
            "get",
            makePage(
              [
                makeComment({ id: A1, repliesCount: 2 }),
                makeComment({ id: A2, repliesCount: 2 }),
              ],
              null,
            ),
          ),
      },
    );
    return { ...rendered, current };
  }

  it("a load in flight for the old comment isn't the new comment's loading, and doesn't block its loadMore", async () => {
    const { result, rerender, current, axiosPrivate } = renderSwitchable();
    await settled(result);

    let settleA1!: { resolve: (v: unknown) => void; reject: (e: unknown) => void };
    (axiosPrivate.instance.get as unknown as {
      mockImplementationOnce: (f: () => Promise<unknown>) => void;
    }).mockImplementationOnce(
      () => new Promise((resolve, reject) => { settleA1 = { resolve, reject }; }),
    );
    let pendingA1!: Promise<void>;
    act(() => {
      pendingA1 = result.current.replies.loadMore();
    });
    expect(result.current.replies.loading).toBe(true);

    current.commentId = A2;
    rerender();
    expect(result.current.replies.comment?.id).toBe(A2);
    expect(result.current.replies.loading).toBe(false);

    const R2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2";
    axiosPrivate.mockResponse("get", makePage([makeComment({ id: R2, parentId: A2 })], null));
    await act(async () => {
      await result.current.replies.loadMore();
    });
    expect(result.current.replies.replies.map((c) => c.id)).toEqual([R2]);
    expect(result.current.replies.loading).toBe(false);

    // The old comment's load fails late: not this comment's error.
    await act(async () => {
      settleA1.reject(Object.assign(new Error("boom"), { response: { status: 500 } }));
      await pendingA1;
    });
    expect(result.current.replies.error).toBeNull();
    expect(result.current.replies.loading).toBe(false);
    expect(result.current.replies.replies.map((c) => c.id)).toEqual([R2]);
  });

  it("the old comment's error isn't shown for the new comment, and comes back with it", async () => {
    const { result, rerender, current, axiosPrivate } = renderSwitchable();
    await settled(result);

    axiosPrivate.mockError("get", 500, {});
    await act(async () => {
      await result.current.replies.loadMore();
    });
    expect(result.current.replies.error).toBeInstanceOf(Error);

    current.commentId = A2;
    rerender();
    expect(result.current.replies.error).toBeNull();
  });

  it("a late page for the old comment still lands under that comment in the store", async () => {
    const { result, rerender, current, axiosPrivate } = renderSwitchable();
    await settled(result);

    let resolveA1!: (v: unknown) => void;
    (axiosPrivate.instance.get as unknown as {
      mockImplementationOnce: (f: () => Promise<unknown>) => void;
    }).mockImplementationOnce(() => new Promise((resolve) => { resolveA1 = resolve; }));
    let pendingA1!: Promise<void>;
    act(() => {
      pendingA1 = result.current.replies.loadMore();
    });
    current.commentId = A2;
    rerender();

    const R1a = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1";
    await act(async () => {
      resolveA1({ data: makePage([makeComment({ id: R1a, parentId: A1 })], null), status: 200 });
      await pendingA1;
    });
    expect(result.current.replies.replies).toEqual([]);
    expect(result.current.replies.loading).toBe(false);

    current.commentId = A1;
    rerender();
    expect(result.current.replies.replies.map((c) => c.id)).toEqual([R1a]);
    expect(result.current.replies.hasMore).toBe(false);
  });
});
