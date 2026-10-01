import { describe, it, expect, afterEach, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { resetAxiosMocks } from "../../test-utils";
import { renderWithCommentSection, makeComment } from "./testHelpers";
import useReplies from "./useReplies";
import type { EntityCommentsTree } from "../../interfaces/EntityCommentsTree";
import type { PaginatedResponse } from "../../interfaces/PaginatedResponse";
import type { Comment } from "../../interfaces/models/Comment";

afterEach(() => {
  resetAxiosMocks();
});

const VALID_COMMENT_ID = "11111111-1111-4111-8111-111111111111";

function makePage(comments: Comment[]): PaginatedResponse<Comment> {
  return {
    data: comments,
    pagination: { page: 1, pageSize: 5, totalPages: 1, totalItems: comments.length, hasMore: false },
  };
}

describe("useReplies", () => {
  it("returns empty replies when the comment is not found in the tree", () => {
    const { result, axiosPrivate } = renderWithCommentSection(
      () => useReplies({ commentId: "missing-comment", sortBy: "new" }),
      { commentSectionValue: { entityCommentsTree: {}, addCommentsToTree: vi.fn() } },
    );

    expect(result.current.replies).toEqual([]);
    expect(result.current.newReplies).toEqual([]);
    expect(result.current.page).toBe(0);
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("does not fetch when paged while the comment is not in the tree", async () => {
    const { result, axiosPrivate } = renderWithCommentSection(
      () => useReplies({ commentId: VALID_COMMENT_ID, sortBy: "new" }),
      { commentSectionValue: { entityCommentsTree: {}, addCommentsToTree: vi.fn() } },
    );

    act(() => {
      result.current.setPage(1);
    });

    expect(result.current.page).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("keeps working when the comment enters and leaves the tree between renders", () => {
    const reply = makeComment({ id: "reply-1", parentId: VALID_COMMENT_ID });
    const present: EntityCommentsTree = {
      [VALID_COMMENT_ID]: {
        comment: makeComment({ id: VALID_COMMENT_ID }),
        new: false,
        replies: { [reply.id]: { ...reply, new: false } },
      },
    };
    // The wrapper hands this same object to the context, so mutating it and
    // re-rendering is how the tree changes under the hook.
    const commentSectionValue = {
      entityCommentsTree: {} as EntityCommentsTree,
      addCommentsToTree: vi.fn(),
    };

    const { result, rerender } = renderWithCommentSection(
      () => useReplies({ commentId: VALID_COMMENT_ID, sortBy: "new" }),
      { commentSectionValue },
    );
    expect(result.current.replies).toEqual([]);

    commentSectionValue.entityCommentsTree = present;
    rerender();
    expect(result.current.replies.map((r) => r.id)).toEqual(["reply-1"]);

    commentSectionValue.entityCommentsTree = {};
    rerender();
    expect(result.current.replies).toEqual([]);
  });

  it("splits existing replies into already-seen vs. new (sorted most-recent-first)", () => {
    const oldReply = makeComment({ id: "reply-old", parentId: VALID_COMMENT_ID });
    const newReply1 = makeComment({
      id: "reply-new-1",
      parentId: VALID_COMMENT_ID,
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    const newReply2 = makeComment({
      id: "reply-new-2",
      parentId: VALID_COMMENT_ID,
      createdAt: "2024-01-02T00:00:00.000Z",
    });

    const entityCommentsTree: EntityCommentsTree = {
      [VALID_COMMENT_ID]: {
        comment: makeComment({ id: VALID_COMMENT_ID }),
        new: false,
        replies: {
          [oldReply.id]: { ...oldReply, new: false },
          [newReply1.id]: { ...newReply1, new: true },
          [newReply2.id]: { ...newReply2, new: true },
        },
      },
    };

    const { result } = renderWithCommentSection(
      () => useReplies({ commentId: VALID_COMMENT_ID, sortBy: "new" }),
      { commentSectionValue: { entityCommentsTree, addCommentsToTree: vi.fn() } },
    );

    expect(result.current.replies.map((r) => r.id)).toEqual(["reply-old"]);
    expect(result.current.newReplies.map((r) => r.id)).toEqual([
      "reply-new-2",
      "reply-new-1",
    ]);
  });

  it("fetches a page of replies and merges them into the comment tree once paged past 0", async () => {
    const addCommentsToTree = vi.fn();
    const entityCommentsTree: EntityCommentsTree = {
      [VALID_COMMENT_ID]: {
        comment: makeComment({ id: VALID_COMMENT_ID }),
        new: false,
        replies: {},
      },
    };

    const { result, axiosPrivate } = renderWithCommentSection(
      () => useReplies({ commentId: VALID_COMMENT_ID, sortBy: "new" }),
      { commentSectionValue: { entityCommentsTree, addCommentsToTree } },
    );

    const fetchedReply = makeComment({ id: "reply-1", parentId: VALID_COMMENT_ID });
    axiosPrivate.mockResponse("get", makePage([fetchedReply]));

    act(() => {
      result.current.setPage(1);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toMatchObject({
      parentId: VALID_COMMENT_ID,
      page: 1,
      include: "user",
    });
    expect(addCommentsToTree).toHaveBeenCalledWith([fetchedReply]);
  });

  it("does not fetch when the comment ID is not a valid UUID (e.g. an optimistic temp ID)", async () => {
    const entityCommentsTree: EntityCommentsTree = {
      "temp-123": {
        comment: makeComment({ id: "temp-123" }),
        new: true,
        replies: {},
      },
    };

    const { result, axiosPrivate } = renderWithCommentSection(
      () => useReplies({ commentId: "temp-123", sortBy: "new" }),
      { commentSectionValue: { entityCommentsTree, addCommentsToTree: vi.fn() } },
    );

    act(() => {
      result.current.setPage(1);
    });

    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});
