import { describe, it, expect, afterEach } from "vitest";
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

  it("continues nested replies under the server-resolved sort for the deprecated `old` alias", async () => {
    const { result, axiosPrivate } = renderReplies({
      topLevel: [makeComment({ id: C1, repliesCount: 3 })],
      providerProps: {
        defaultSortBy: "old",
        defaultSortDir: "desc",
        replySortBy: "top",
      },
    });
    await settled(result);

    axiosPrivate.mockResponse("get", makePage([], null));
    await act(async () => {
      await result.current.replies.loadMore();
    });
    // The server resolves `old` → createdAt asc before defaulting replySortDir.
    expect(axiosPrivate.calls("get")[1].config?.params).toMatchObject({
      sortBy: "top",
      sortDir: "asc",
    });
  });
});
