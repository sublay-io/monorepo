import { describe, it, expect, afterEach, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeAuthUser,
  axiosErrorWithStatus,
} from "../../test-utils";
import { axiosPrivate } from "../../config/axios";
import useCommentSectionData from "./useCommentSectionData";
import { makeComment, makeEntity } from "./testHelpers";
import type { Comment } from "../../interfaces/models/Comment";

afterEach(() => {
  resetAxiosMocks();
  vi.restoreAllMocks();
});

const A = "11111111-1111-4111-8111-111111111111";
const G = "22222222-2222-4222-8222-222222222222";
const P = "33333333-3333-4333-8333-333333333333";
const T = "44444444-4444-4444-8444-444444444444";

const ok = (data: unknown) =>
  Promise.resolve({ data, status: 200, statusText: "OK", headers: {}, config: {} } as any);
const page = (data: Comment[]) => ({
  data,
  pagination: { nextCursor: null, hasMore: false },
});

describe("useCommentSectionData — a failed reply keeps its target", () => {
  it("a reply the server refuses is still a reply to the same comment when sent again", async () => {
    const entity = makeEntity({ id: "entity-1", commentsCount: 5 });
    const top = makeComment({
      id: A,
      entityId: "entity-1",
      parentId: null,
      repliesCount: 2,
      user: makeAuthUser({ id: "user-3", username: "carol" }) as any,
    });
    vi.spyOn(axiosPrivate, "get").mockImplementation(() => ok(page([top])));
    const post = vi
      .spyOn(axiosPrivate, "post")
      .mockImplementationOnce(() =>
        Promise.reject(axiosErrorWithStatus(403, { code: "comment/parent-deleted" })),
      )
      .mockImplementation((_url: string, body: any) =>
        ok(makeComment({ id: G, entityId: "entity-1", parentId: body.parentId ?? null })),
      );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHookWithAxios(() => useCommentSectionData({ entity }), {
      user: makeAuthUser({ id: "user-1", username: "u" }),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Reply on a top-level comment, sent from the section's main form.
    act(() => result.current.handleDeepReply(top));
    expect(result.current.repliedToComment?.id).toBe(A);
    expect(result.current.showReplyBanner).toBe(true);

    const first = await result.current.createComment({ content: "my reply" });
    expect(first).toBeUndefined();
    expect((post.mock.calls[0][1] as any).parentId).toBe(A);

    // The optimistic row and count are rolled back; the reply target stays.
    await waitFor(() => expect(result.current.submittingComment).toBe(false));
    await waitFor(() => expect(result.current.getComment(A)?.repliesCount).toBe(2));
    expect(result.current.newComments).toHaveLength(0);
    await waitFor(() => expect(result.current.repliedToComment?.id).toBe(A));
    expect(result.current.showReplyBanner).toBe(true);
    expect(result.current.repliedToComment?.user?.id).toBe("user-3");

    let second: Comment | undefined;
    await act(async () => {
      second = await result.current.createComment({ content: "my reply" });
    });
    expect((post.mock.calls[1][1] as any).parentId).toBe(A);
    expect(second?.parentId).toBe(A);
    // Not a new top-level comment.
    expect(result.current.newComments).toHaveLength(0);
    // A reply that went through clears the target.
    expect(result.current.repliedToComment).toBeNull();
    expect(result.current.showReplyBanner).toBe(false);
  });

  it("a failed same-level reply keeps its parent, and doesn't push the mention a second time", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const top = makeComment({ id: A, entityId: "entity-1", parentId: null, repliesCount: 1 });
    const mentioned = makeAuthUser({ id: "user-2", username: "bob" });
    const reply = makeComment({
      id: P,
      entityId: "entity-1",
      parentId: A,
      user: mentioned as any,
    });
    vi.spyOn(axiosPrivate, "get").mockImplementation(() => ok(page([top])));
    const post = vi
      .spyOn(axiosPrivate, "post")
      .mockImplementationOnce(() => Promise.reject(axiosErrorWithStatus(500, {})))
      .mockImplementation((_url: string, body: any) =>
        ok(makeComment({ id: G, entityId: "entity-1", parentId: body.parentId ?? null })),
      );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHookWithAxios(() => useCommentSectionData({ entity }), {
      user: makeAuthUser({ id: "user-1", username: "u" }),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.handleShallowReply(reply));
    expect(result.current.repliedToComment?.id).toBe(A);
    expect(result.current.pushMention?.id).toBe("user-2");

    await result.current.createComment({ content: "@bob hello" });
    await waitFor(() => expect(result.current.submittingComment).toBe(false));
    await waitFor(() => expect(result.current.repliedToComment?.id).toBe(A));
    // The form still holds the text with the mention in it; pushing the
    // mention again would write it a second time.
    expect(result.current.pushMention).toBeNull();

    await act(async () => {
      await result.current.createComment({ content: "@bob hello" });
    });
    expect((post.mock.calls[1][1] as any).parentId).toBe(A);
  });

  it("Reply on a comment, then on one of its replies: the restored banner still has a name", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const topAuthor = makeAuthUser({ id: "user-3", username: "carol" });
    const top = makeComment({
      id: A,
      entityId: "entity-1",
      parentId: null,
      repliesCount: 1,
      user: topAuthor as any,
    });
    const mentioned = makeAuthUser({ id: "user-2", username: "bob" });
    const reply = makeComment({ id: P, entityId: "entity-1", parentId: A, user: mentioned as any });
    vi.spyOn(axiosPrivate, "get").mockImplementation(() => ok(page([top])));
    vi.spyOn(axiosPrivate, "post").mockImplementation(() =>
      Promise.reject(axiosErrorWithStatus(500, {})),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHookWithAxios(() => useCommentSectionData({ entity }), {
      user: makeAuthUser({ id: "user-1", username: "u" }),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.handleDeepReply(top));
    act(() => result.current.handleShallowReply(reply));
    // The banner is up and names the mentioned user (pushMention).
    expect(result.current.showReplyBanner).toBe(true);
    expect(result.current.pushMention?.id).toBe("user-2");
    expect(result.current.repliedToComment?.id).toBe(A);

    await result.current.createComment({ content: "@bob hello" });
    await waitFor(() => expect(result.current.submittingComment).toBe(false));
    await waitFor(() => expect(result.current.repliedToComment?.id).toBe(A));

    // Still a reply to the same comment, and the banner names who it named.
    expect(result.current.showReplyBanner).toBe(true);
    expect(result.current.pushMention).toBeNull();
    expect(result.current.repliedToComment?.user?.id).toBe("user-2");
  });

  it("a restored target with nobody to name doesn't bring the banner back", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const top = makeComment({ id: A, entityId: "entity-1", parentId: null, repliesCount: 1 });
    vi.spyOn(axiosPrivate, "get").mockImplementation(() => ok(page([top])));
    vi.spyOn(axiosPrivate, "post").mockImplementation(() =>
      Promise.reject(axiosErrorWithStatus(500, {})),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHookWithAxios(() => useCommentSectionData({ entity }), {
      user: makeAuthUser({ id: "user-1", username: "u" }),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // A target without an author, with the banner up.
    act(() => {
      result.current.setRepliedToComment({ id: A } as Comment);
      result.current.setShowReplyBanner({ newState: true });
    });

    await result.current.createComment({ content: "hello" });
    await waitFor(() => expect(result.current.submittingComment).toBe(false));
    await waitFor(() => expect(result.current.repliedToComment?.id).toBe(A));
    expect(result.current.showReplyBanner).toBe(false);
  });

  it("a reply target picked while the failed request was in flight isn't overwritten", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const a = makeComment({ id: A, entityId: "entity-1", parentId: null });
    const g = makeComment({ id: G, entityId: "entity-1", parentId: null });
    vi.spyOn(axiosPrivate, "get").mockImplementation(() => ok(page([a, g])));
    let reject!: (err: unknown) => void;
    vi.spyOn(axiosPrivate, "post").mockImplementation(
      () => new Promise((_resolve, rej) => (reject = rej)),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHookWithAxios(() => useCommentSectionData({ entity }), {
      user: makeAuthUser({ id: "user-1", username: "u" }),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.handleDeepReply(a));
    const pending = result.current.createComment({ content: "my reply" });
    await waitFor(() => expect(result.current.repliedToComment).toBeNull());
    act(() => result.current.handleDeepReply(g));

    reject(axiosErrorWithStatus(500, {}));
    await pending;
    await waitFor(() => expect(result.current.submittingComment).toBe(false));
    expect(result.current.repliedToComment?.id).toBe(G);
  });
});

describe("useCommentSectionData — a highlight on another entity, section given a foreignId", () => {
  const gatedEntity = () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    return { gate, release: () => release() };
  };

  it("is dropped once the entity resolves: no highlight, not in the store, not re-seeded", async () => {
    const otherParent = makeComment({ id: P, entityId: "entity-OTHER", parentId: null });
    const other = {
      ...makeComment({ id: T, entityId: "entity-OTHER", parentId: P }),
      parentComment: otherParent,
    };
    const { gate, release } = gatedEntity();
    vi.spyOn(axiosPrivate, "get").mockImplementation((url: string) => {
      if (url.endsWith(`/comments/${T}`)) return ok(other);
      if (url.includes("/entities/by-foreign-id")) {
        return gate.then(() => ok(makeEntity({ id: "entity-1", foreignId: "f1" })));
      }
      return ok(page([]));
    });

    const { result } = renderHookWithAxios(() =>
      useCommentSectionData({ foreignId: "f1", highlightedCommentId: T }),
    );
    await waitFor(() => expect(result.current.highlightedCommentLoading).toBe(false));

    release();
    await waitFor(() => expect(result.current.entity?.id).toBe("entity-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await waitFor(() => expect(result.current.highlightedComment).toBeNull());
    expect(result.current.highlightedCommentLoading).toBe(false);
    expect(result.current.getComment(T)).toBeUndefined();
    expect(result.current.getComment(P)).toBeUndefined();
    expect(result.current.comments).toEqual([]);

    // A sort reset doesn't bring it back.
    act(() => result.current.setSortBy("createdAt"));
    await waitFor(() => expect(result.current.sortBy).toBe("createdAt"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.highlightedComment).toBeNull();
    expect(result.current.getComment(T)).toBeUndefined();
    expect(result.current.getComment(P)).toBeUndefined();
    expect(result.current.comments).toEqual([]);
  });

  it("keeps a highlight on the section's own entity that arrived before the entity resolved", async () => {
    const parent = makeComment({ id: P, entityId: "entity-1", parentId: null, repliesCount: 1 });
    const target = {
      ...makeComment({ id: T, entityId: "entity-1", parentId: P }),
      parentComment: parent,
    };
    const { gate, release } = gatedEntity();
    vi.spyOn(axiosPrivate, "get").mockImplementation((url: string) => {
      if (url.endsWith(`/comments/${T}`)) return ok(target);
      if (url.includes("/entities/by-foreign-id")) {
        return gate.then(() => ok(makeEntity({ id: "entity-1", foreignId: "f1" })));
      }
      return ok(page([]));
    });

    const { result } = renderHookWithAxios(() =>
      useCommentSectionData({ foreignId: "f1", highlightedCommentId: T }),
    );
    await waitFor(() => expect(result.current.highlightedCommentLoading).toBe(false));
    expect(result.current.highlightedComment?.comment.id).toBe(T);

    release();
    await waitFor(() => expect(result.current.entity?.id).toBe("entity-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.highlightedComment?.comment.id).toBe(T);
    expect(result.current.highlightedComment?.parentComment?.id).toBe(P);
    expect(result.current.getComment(T)).toBeDefined();
    expect(result.current.comments.map((c) => c.id)).toEqual([P]);

    act(() => result.current.setSortBy("createdAt"));
    await waitFor(() => expect(result.current.sortBy).toBe("createdAt"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.highlightedComment?.comment.id).toBe(T);
    expect(result.current.comments.map((c) => c.id)).toEqual([P]);
  });
});
