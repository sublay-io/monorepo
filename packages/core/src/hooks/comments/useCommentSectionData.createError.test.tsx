import { describe, it, expect, afterEach, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeAuthUser } from "../../test-utils";
import { axiosPrivate as axiosPrivateInstance } from "../../config/axios";
import { SuspendedError } from "../../errors/SuspendedError";
import useCommentSectionData from "./useCommentSectionData";
import { makeComment, makeEntity } from "./testHelpers";
import type { CursorPaginatedResponse } from "../../interfaces/PaginatedResponse";
import type { Comment } from "../../interfaces/models/Comment";

afterEach(() => {
  resetAxiosMocks();
  vi.restoreAllMocks();
});

const P = "33333333-3333-4333-8333-333333333333";

function commentsPage(data: Comment[]): CursorPaginatedResponse<Comment> {
  return { data, pagination: { nextCursor: null, hasMore: false } };
}

const viewer = makeAuthUser({ id: "user-1", username: "alice" });
const entity = makeEntity({ id: "entity-1", commentsCount: 4 });

function makeParent(overrides: Partial<Comment> = {}): Comment {
  return makeComment({
    id: P,
    entityId: "entity-1",
    parentId: null,
    userId: "user-2",
    user: makeAuthUser({ id: "user-2", username: "bob" }) as any,
    content: "the parent",
    metadata: { a: 1 },
    repliesCount: 2,
    ...overrides,
  });
}

function renderSection(
  parent: Comment | null,
  callbacks?: Record<string, (...args: any[]) => void>,
) {
  vi.spyOn(console, "error").mockImplementation(() => {});
  return renderHookWithAxios(() => useCommentSectionData({ entity, callbacks }), {
    user: viewer,
    beforeRender: ({ axiosPrivate }) =>
      axiosPrivate.mockResponse("get", commentsPage(parent ? [parent] : [])),
  });
}

describe("useCommentSectionData — a failed create is reported", () => {
  it("calls commentCreateFailedCallback with the server's code, message, status and the parent id", async () => {
    const commentCreateFailedCallback = vi.fn();
    const { result, axiosPrivate } = renderSection(makeParent(), {
      commentCreateFailedCallback,
    });
    await waitFor(() => expect(result.current.comments).toHaveLength(1));

    axiosPrivate.mockError("post", 403, {
      error: "This comment was deleted and can't be replied to.",
      code: "comment/parent-deleted",
    });
    const returned = await result.current.createComment({ parentId: P, content: "a reply" });

    expect(returned).toBeUndefined();
    expect(commentCreateFailedCallback).toHaveBeenCalledTimes(1);
    expect(commentCreateFailedCallback).toHaveBeenCalledWith({
      code: "comment/parent-deleted",
      message: "This comment was deleted and can't be replied to.",
      status: 403,
      parentId: P,
    });
  });

  it("reports a top-level comment with parentId null", async () => {
    const commentCreateFailedCallback = vi.fn();
    const { result, axiosPrivate } = renderSection(null, { commentCreateFailedCallback });
    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockError("post", 500, {
      error: "Internal server error",
      code: "comment/server-error",
    });
    await result.current.createComment({ content: "hello there" });

    expect(commentCreateFailedCallback).toHaveBeenCalledWith({
      code: "comment/server-error",
      message: "Internal server error",
      status: 500,
      parentId: null,
    });
  });

  it("a network error has no code, message or status", async () => {
    const commentCreateFailedCallback = vi.fn();
    const { result, axiosPrivate } = renderSection(makeParent(), {
      commentCreateFailedCallback,
    });
    await waitFor(() => expect(result.current.comments).toHaveLength(1));

    axiosPrivate.mockNetworkError("post");
    await result.current.createComment({ parentId: P, content: "a reply" });

    expect(commentCreateFailedCallback).toHaveBeenCalledWith({
      code: undefined,
      message: undefined,
      status: undefined,
      parentId: P,
    });
    await waitFor(() =>
      expect(result.current.createError).toEqual({
        code: undefined,
        message: undefined,
        status: undefined,
        parentId: P,
      }),
    );
    // Not one of the parent codes: the parent is left as it was.
    expect(result.current.getComment(P)?.content).toBe("the parent");
    expect(result.current.getComment(P)?.userDeletedAt).toBeFalsy();
  });

  it("a suspended user's refused comment reports user/suspended, the message and 403", async () => {
    const commentCreateFailedCallback = vi.fn();
    const { result } = renderSection(makeParent(), { commentCreateFailedCallback });
    await waitFor(() => expect(result.current.comments).toHaveLength(1));

    // What the response interceptor rejects with for a 403 user/suspended:
    // a typed error with no `response`.
    vi.spyOn(axiosPrivateInstance, "post").mockRejectedValueOnce(
      new SuspendedError({
        message: "Your account is suspended.",
        reason: "spam",
        endDate: null,
      }),
    );
    await result.current.createComment({ parentId: P, content: "a reply" });

    const expected = {
      code: "user/suspended",
      message: "Your account is suspended.",
      status: 403,
      parentId: P,
    };
    expect(commentCreateFailedCallback).toHaveBeenCalledWith(expected);
    await waitFor(() => expect(result.current.createError).toEqual(expected));
    // The parent is left as it was.
    expect(result.current.getComment(P)?.content).toBe("the parent");
  });

  it("sets createError on failure and clears it when the next create starts", async () => {
    const { result, axiosPrivate } = renderSection(null);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.createError).toBeNull();

    axiosPrivate.mockError("post", 400, {
      error: "Webhook validation rejected",
      code: "comment/webhook-validation-failed",
    });
    await result.current.createComment({ content: "hello there" });
    await waitFor(() =>
      expect(result.current.createError).toEqual({
        code: "comment/webhook-validation-failed",
        message: "Webhook validation rejected",
        status: 400,
        parentId: null,
      }),
    );

    // The next create: cleared while it is in flight, and still clear after it succeeds.
    let resolvePost!: (value: unknown) => void;
    vi.spyOn(axiosPrivateInstance, "post").mockImplementationOnce(
      () => new Promise((resolve) => (resolvePost = resolve)) as any,
    );
    let pending!: Promise<Comment | undefined>;
    act(() => {
      pending = result.current.createComment({ content: "hello again" });
    });
    await waitFor(() => expect(result.current.submittingComment).toBe(true));
    expect(result.current.createError).toBeNull();

    await act(async () => {
      resolvePost({
        data: makeComment({ id: "c-2", entityId: "entity-1", content: "hello again" }),
        status: 201,
        statusText: "Created",
        headers: {},
        config: {},
      });
      await pending;
    });
    expect(result.current.createError).toBeNull();
    expect(result.current.newComments).toHaveLength(1);
  });

  it("a refused create that never reaches the server leaves createError alone", async () => {
    const commentTooShortCallback = vi.fn();
    const { result, axiosPrivate } = renderSection(null, { commentTooShortCallback });
    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockError("post", 500, { error: "Internal server error" });
    await result.current.createComment({ content: "hello there" });
    await waitFor(() => expect(result.current.createError).not.toBeNull());

    await act(async () => {
      await result.current.createComment({ content: "x" });
    });
    expect(commentTooShortCallback).toHaveBeenCalledTimes(1);
    expect(result.current.createError).toMatchObject({ status: 500, parentId: null });
  });

  it("comment/parent-deleted turns the parent into the deleted placeholder", async () => {
    const { result, axiosPrivate } = renderSection(makeParent());
    await waitFor(() => expect(result.current.comments).toHaveLength(1));

    axiosPrivate.mockError("post", 403, {
      error: "This comment was deleted and can't be replied to.",
      code: "comment/parent-deleted",
    });
    await result.current.createComment({ parentId: P, content: "a reply" });

    await waitFor(() => expect(result.current.getComment(P)?.userDeletedAt).toBeTruthy());
    const parent = result.current.getComment(P)!;
    expect(parent).toMatchObject({
      id: P,
      userId: null,
      user: null,
      content: null,
      gif: null,
      metadata: null,
      mentions: [],
      attachments: [],
      // The optimistic +1 is taken back; the placeholder keeps its count.
      repliesCount: 2,
    });
    // Still listed, as a placeholder.
    expect(result.current.comments.map((c) => c.id)).toEqual([P]);
    expect(result.current.newComments).toHaveLength(0);
    expect(result.current.createError?.code).toBe("comment/parent-deleted");
  });

  it("comment/parent-removed turns someone else's parent into the removed placeholder", async () => {
    const { result, axiosPrivate } = renderSection(makeParent());
    await waitFor(() => expect(result.current.comments).toHaveLength(1));

    axiosPrivate.mockError("post", 403, {
      error: "This comment was removed and can't be replied to.",
      code: "comment/parent-removed",
    });
    await result.current.createComment({ parentId: P, content: "a reply" });

    await waitFor(() => expect(result.current.getComment(P)?.moderationStatus).toBe("removed"));
    const parent = result.current.getComment(P)!;
    expect(parent).toMatchObject({
      userId: null,
      user: null,
      content: null,
      gif: null,
      metadata: null,
      mentions: [],
      attachments: [],
      repliesCount: 2,
    });
    expect(parent.userDeletedAt).toBeFalsy();
  });

  it("comment/parent-removed on the viewer's own comment keeps its content", async () => {
    const { result, axiosPrivate } = renderSection(
      makeParent({ userId: viewer.id, user: viewer as any }),
    );
    await waitFor(() => expect(result.current.comments).toHaveLength(1));

    axiosPrivate.mockError("post", 403, {
      error: "This comment was removed and can't be replied to.",
      code: "comment/parent-removed",
    });
    await result.current.createComment({ parentId: P, content: "a reply" });

    await waitFor(() => expect(result.current.getComment(P)?.moderationStatus).toBe("removed"));
    const parent = result.current.getComment(P)!;
    expect(parent.userId).toBe(viewer.id);
    expect(parent.content).toBe("the parent");
    expect(parent.metadata).toEqual({ a: 1 });
    expect(parent.user).toBeTruthy();
  });

  it("marks the parent when the reply went through the section's reply target", async () => {
    const top = makeParent();
    const { result, axiosPrivate } = renderSection(top);
    await waitFor(() => expect(result.current.comments).toHaveLength(1));

    act(() => result.current.handleDeepReply(top));
    axiosPrivate.mockError("post", 403, { code: "comment/parent-deleted" });
    await result.current.createComment({ content: "a reply" });

    await waitFor(() => expect(result.current.getComment(P)?.userDeletedAt).toBeTruthy());
    expect(result.current.createError).toMatchObject({
      code: "comment/parent-deleted",
      parentId: P,
    });
    // The reply target and its banner are kept, as for any failed create.
    await waitFor(() => expect(result.current.repliedToComment?.id).toBe(P));
    expect(result.current.showReplyBanner).toBe(true);
  });

  it("without the callback a failed create behaves as before", async () => {
    const { result, axiosPrivate } = renderSection(makeParent());
    await waitFor(() => expect(result.current.comments).toHaveLength(1));

    axiosPrivate.mockError("post", 500, { error: "Internal server error" });
    const returned = await result.current.createComment({ parentId: P, content: "a reply" });

    expect(returned).toBeUndefined();
    await waitFor(() => expect(result.current.submittingComment).toBe(false));
    await waitFor(() => expect(result.current.getComment(P)?.repliesCount).toBe(2));
    expect(result.current.newComments).toHaveLength(0);
    expect(result.current.getComment(P)?.content).toBe("the parent");
  });

  it("a callback that throws doesn't make createComment reject", async () => {
    const { result, axiosPrivate } = renderSection(null, {
      commentCreateFailedCallback: () => {
        throw new Error("boom");
      },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockError("post", 500, { error: "Internal server error" });
    await expect(result.current.createComment({ content: "hello there" })).resolves.toBeUndefined();
    await waitFor(() => expect(result.current.submittingComment).toBe(false));
  });
});
