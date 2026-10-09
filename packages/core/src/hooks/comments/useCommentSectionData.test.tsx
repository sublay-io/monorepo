import { describe, it, expect, afterEach, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeAuthUser } from "../../test-utils";
import useCommentSectionData from "./useCommentSectionData";
import { makeComment, makeEntity } from "./testHelpers";
import type { CursorPaginatedResponse } from "../../interfaces/PaginatedResponse";
import type { Comment } from "../../interfaces/models/Comment";

afterEach(() => {
  resetAxiosMocks();
});

function emptyCommentsPage(): CursorPaginatedResponse<Comment> {
  return { data: [], pagination: { nextCursor: null, hasMore: false } };
}

function commentsPage(data: Comment[]): CursorPaginatedResponse<Comment> {
  return { data, pagination: { nextCursor: null, hasMore: false } };
}

describe("useCommentSectionData", () => {
  it("resolves an entity by entityId and loads its root comments", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const comment = makeComment({ entityId: "entity-1" });

    // Resolving the entity triggers a cascading comments-list fetch in the same
    // effect-flush cycle, so both "get" responses must be queued up front —
    // there's no synchronization point between the two to mock them one at a time.
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useCommentSectionData({ entityId: "entity-1" }),
      {
        beforeRender: ({ axiosPrivate }) => {
          axiosPrivate.mockResponse("get", entity); // entity fetch
          axiosPrivate.mockResponse("get", commentsPage([comment])); // comments fetch, cascades off the entity fetch resolving
        },
      },
    );

    await waitFor(() => expect(result.current.comments).toEqual([comment]));
    expect(result.current.entity).toEqual(entity);

    const [entityCall, commentsCall] = axiosPrivate.calls("get");
    expect(entityCall.url).toBe("/test-project/entities/entity-1");
    expect(commentsCall.url).toBe("/test-project/comments");
    expect(commentsCall.config?.params).toEqual({
      entityId: "entity-1",
      limit: 15,
      sortBy: "top",
      sortDir: "desc",
      include: "user",
    });
  });

  it("creates a comment optimistically and replaces it with the server response", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const user = makeAuthUser({ id: "user-1", username: "alice" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useCommentSectionData({ entity }),
      {
        user,
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", emptyCommentsPage()),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const serverComment = makeComment({ id: "comment-1", content: "Hello there" });
    axiosPrivate.mockResponse("post", serverComment, 201);

    let returned: Comment | undefined;
    await act(async () => {
      returned = await result.current.createComment({ content: "Hello there" });
    });

    expect(returned).toEqual(serverComment);
    // Freshly-created comments are tracked as "new" (separate from the
    // initial-load `comments` list) until a refetch folds them in.
    expect(result.current.newComments).toEqual([serverComment]);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/comments");
    expect(call.body).toMatchObject({ entityId: "entity-1", content: "Hello there" });
  });

  it("rolls back the optimistic comment when the create request fails", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const user = makeAuthUser({ id: "user-1", username: "alice" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useCommentSectionData({ entity }),
      {
        user,
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", emptyCommentsPage()),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockError("post", 500, { message: "Internal error" });

    let returned: Comment | undefined;
    await act(async () => {
      returned = await result.current.createComment({ content: "Hello there" });
    });

    expect(returned).toBeUndefined();
    expect(result.current.comments).toEqual([]);
    expect(result.current.submittingComment).toBe(false);
  });

  it("does not submit and signals login-required when there is no authenticated user", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const loginRequiredCallback = vi.fn();

    const { result, axiosPrivate } = renderHookWithAxios(
      () =>
        useCommentSectionData({
          entity,
          callbacks: { loginRequiredCallback },
        }),
      {
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", emptyCommentsPage()),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createComment({ content: "Hello there" });
    });

    expect(loginRequiredCallback).toHaveBeenCalledTimes(1);
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });

  it("soft-deletes a comment (Reddit-style placeholder) via deleteComment", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const commentId = "11111111-1111-4111-8111-111111111111";
    const seededComment = makeComment({ id: commentId, entityId: "entity-1" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useCommentSectionData({ entity }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", commentsPage([seededComment])),
      },
    );

    await waitFor(() => expect(result.current.comments).toEqual([seededComment]));

    axiosPrivate.mockResponse("delete", undefined, 204);

    await act(async () => {
      await result.current.deleteComment({ commentId });
    });

    const deleted = result.current.getComment(commentId)!;
    expect(deleted.userDeletedAt).not.toBeNull();
    expect(deleted).toMatchObject({
      content: null,
      userId: null,
      user: null,
      metadata: null,
      attachments: [],
      mentions: [],
    });
    // The placeholder stays in place (D24: still counted).
    expect(result.current.comments.map((c) => c.id)).toEqual([commentId]);

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe(`/test-project/comments/${commentId}`);
  });

  it("does not throw when deleteComment's request fails", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const commentId = "11111111-1111-4111-8111-111111111111";
    const seededComment = makeComment({ id: commentId, entityId: "entity-1" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useCommentSectionData({ entity }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", commentsPage([seededComment])),
      },
    );

    await waitFor(() => expect(result.current.comments).toEqual([seededComment]));

    axiosPrivate.mockError("delete", 500, { message: "Internal error" });

    await expect(
      act(async () => {
        await result.current.deleteComment({ commentId });
      }),
    ).resolves.not.toThrow();
  });

  it("updates a comment via updateComment and applies the edit to the stored comment", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const seeded = makeComment({ id: "comment-1", content: "before", userReaction: "like" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useCommentSectionData({ entity }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", commentsPage([seeded])),
      },
    );

    await waitFor(() => expect(result.current.comments).toHaveLength(1));

    // The update response is the bare row: no user/userReaction.
    const { user: _u, userReaction: _r, ...bareRow } = makeComment({
      id: "comment-1",
      content: "updated",
      updatedAt: "2024-03-01T00:00:00.000Z",
    });
    axiosPrivate.mockResponse("patch", bareRow);

    await act(async () => {
      await result.current.updateComment({ commentId: "comment-1", content: "updated" });
    });

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/comments/comment-1");
    expect(call.body).toEqual({ content: "updated" });

    expect(result.current.getComment("comment-1")).toMatchObject({
      content: "updated",
      updatedAt: "2024-03-01T00:00:00.000Z",
      userReaction: "like",
    });
  });

  it("fetches and exposes a highlighted comment by ID", async () => {
    const targetComment = makeComment({ id: "comment-1" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useCommentSectionData({ highlightedCommentId: "comment-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", targetComment),
      },
    );

    await waitFor(() =>
      expect(result.current.highlightedComment).toEqual({
        comment: targetComment,
        parentComment: null,
      }),
    );

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/comments/comment-1");
    // Default section include ("user") plus `parent`.
    expect(call.config?.params).toMatchObject({ include: "user,parent" });
  });

  it("fetches the highlighted comment with the section's include plus parent, de-duplicated", async () => {
    const targetComment = makeComment({ id: "comment-1" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () =>
        useCommentSectionData({
          highlightedCommentId: "comment-1",
          include: ["user", "grants"],
        }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", targetComment),
      },
    );

    await waitFor(() => expect(result.current.highlightedComment).not.toBeNull());
    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/comments/comment-1");
    expect(call.config?.params).toMatchObject({ include: "user,grants,parent" });
  });

  it("does not set the section error when the highlighted comment isn't found, and loads normally", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const comment = makeComment({ id: "c1" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useCommentSectionData({ entity, highlightedCommentId: "missing" }),
      {
        beforeRender: ({ axiosPrivate }) => {
          // The section's page request is issued before the highlight fetch.
          axiosPrivate.mockResponse("get", commentsPage([comment])); // section
          axiosPrivate.mockError("get", 404, { code: "comment/not-found" }); // highlight
        },
      },
    );

    await waitFor(() => expect(result.current.comments).toEqual([comment]));
    expect(axiosPrivate.calls("get")).toHaveLength(2);
    expect(result.current.highlightedComment).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("stores a highlighted reply under its parent, and keeps both across a sort change", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const parent = makeComment({ id: "p1", repliesCount: 5 });
    const target = makeComment({ id: "t1", parentId: "p1", parentComment: parent });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useCommentSectionData({ entity, highlightedCommentId: "t1" }),
      {
        beforeRender: ({ axiosPrivate }) => {
          axiosPrivate.mockResponse("get", emptyCommentsPage()); // section
          axiosPrivate.mockResponse("get", target); // highlight
        },
      },
    );

    await waitFor(() => expect(result.current.highlightedComment).not.toBeNull());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.highlightedComment?.parentComment?.id).toBe("p1");
    expect(result.current.getComment("p1")?.id).toBe("p1");
    expect(result.current.getComment("t1")?.parentId).toBe("p1");

    axiosPrivate.mockResponse("get", emptyCommentsPage());
    act(() => {
      result.current.setSortBy("createdAt");
    });
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(3));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.getComment("t1")).toBeDefined();
    expect(result.current.getComment("p1")).toBeDefined();
  });

  it("an optimistic reply bumps the parent's repliesCount; a failed one rolls it back", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const user = makeAuthUser({ id: "user-1", username: "alice" });
    const parent = makeComment({ id: "p1", repliesCount: 2 });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useCommentSectionData({ entity }),
      {
        user,
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", commentsPage([parent])),
      },
    );
    await waitFor(() => expect(result.current.comments).toHaveLength(1));

    // Success: +1 stays.
    axiosPrivate.mockResponse(
      "post",
      makeComment({ id: "r1", parentId: "p1", content: "a reply" }),
      201,
    );
    await act(async () => {
      await result.current.createComment({ parentId: "p1", content: "a reply" });
    });
    expect(result.current.getComment("p1")?.repliesCount).toBe(3);
    expect(result.current.getComment("r1")).toBeDefined();

    // Failure: rolled back.
    axiosPrivate.mockError("post", 500, { message: "nope" });
    await act(async () => {
      await result.current.createComment({ parentId: "p1", content: "another" });
    });
    expect(result.current.getComment("p1")?.repliesCount).toBe(3);

    // Delete: no change (the placeholder still counts).
    axiosPrivate.mockResponse("delete", undefined, 204);
    const r1 = "11111111-1111-4111-8111-111111111111";
    // seed a real-uuid reply to delete
    axiosPrivate.mockResponse("post", makeComment({ id: r1, parentId: "p1" }), 201);
    await act(async () => {
      await result.current.createComment({ parentId: "p1", content: "third" });
    });
    expect(result.current.getComment("p1")?.repliesCount).toBe(4);
    await act(async () => {
      await result.current.deleteComment({ commentId: r1 });
    });
    expect(result.current.getComment("p1")?.repliesCount).toBe(4);
  });
});
