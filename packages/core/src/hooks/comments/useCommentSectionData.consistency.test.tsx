import { describe, it, expect, afterEach, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeAuthUser } from "../../test-utils";
import { axiosPrivate } from "../../config/axios";
import useCommentSectionData from "./useCommentSectionData";
import { makeComment, makeEntity } from "./testHelpers";
import type { Comment } from "../../interfaces/models/Comment";

afterEach(() => resetAxiosMocks());

const G = "11111111-1111-4111-8111-111111111111";
const T = "33333333-3333-4333-8333-333333333333";
const X = "44444444-4444-4444-8444-444444444444";

const ok = (data: unknown) =>
  Promise.resolve({ data, status: 200, statusText: "OK", headers: {}, config: {} } as any);
const page = (data: Comment[]) => ({ data, pagination: { nextCursor: null, hasMore: false } });

describe("useCommentSectionData — store consistency", () => {
  it("the highlighted comment follows the store: a delete shows its placeholder, and a sort reset keeps it", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const target = makeComment({ id: T, content: "deep linked", parentId: null });
    vi.spyOn(axiosPrivate, "get").mockImplementation((url: string) =>
      url.endsWith(`/comments/${T}`) ? ok(target) : ok(page([])),
    );
    vi.spyOn(axiosPrivate, "delete").mockImplementation(() => ok(undefined));
    const { result } = renderHookWithAxios(
      () => useCommentSectionData({ entity, highlightedCommentId: T }),
      { user: makeAuthUser({ id: "user-1", username: "u" }) },
    );
    await waitFor(() => expect(result.current.highlightedComment).not.toBeNull());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteComment({ commentId: T });
    });
    expect(result.current.highlightedComment!.comment.userDeletedAt).not.toBeNull();
    expect(result.current.highlightedComment!.comment.content).toBeNull();

    act(() => result.current.setSortBy("createdAt"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.getComment(T)?.userDeletedAt).not.toBeNull();
    expect(result.current.getComment(T)?.content).toBeNull();
    expect(result.current.highlightedComment!.comment.content).toBeNull();
  });

  it("drops the highlight when it's cleared and the entity changes, and refetches it when it comes back", async () => {
    let x = makeComment({ id: X, entityId: "entity-A", content: "from A" });
    const get = vi.spyOn(axiosPrivate, "get").mockImplementation((url: string) => {
      if (url.endsWith(`/comments/${X}`)) return ok(x);
      if (url.endsWith("/entities/entity-A")) return ok(makeEntity({ id: "entity-A" }));
      if (url.endsWith("/entities/entity-B")) return ok(makeEntity({ id: "entity-B" }));
      return ok(page([]));
    });
    const highlightFetches = () =>
      get.mock.calls.filter((c) => String(c[0]).endsWith(`/comments/${X}`)).length;

    const { result, rerender } = renderHookWithAxios(
      (p: { entityId: string; h: string | null }) =>
        useCommentSectionData({ entityId: p.entityId, highlightedCommentId: p.h }),
      { initialProps: { entityId: "entity-A", h: X } } as any,
    );
    await waitFor(() => expect(result.current.highlightedComment).not.toBeNull());
    await waitFor(() => expect(result.current.entity?.id).toBe("entity-A"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(highlightFetches()).toBe(1);

    rerender({ entityId: "entity-B", h: null });
    await waitFor(() => expect(result.current.entity?.id).toBe("entity-B"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.highlightedComment).toBeNull();
    expect(result.current.comments).toEqual([]);
    expect(result.current.getComment(X)).toBeUndefined();

    // X → null → X fetches it again (here a comment on entity B).
    x = makeComment({ id: X, entityId: "entity-B", content: "from B" });
    rerender({ entityId: "entity-B", h: X });
    await waitFor(() => expect(highlightFetches()).toBe(2));
    await waitFor(() => expect(result.current.highlightedComment?.comment.id).toBe(X));
  });

  it("switching entity with the same highlight id doesn't carry the other entity's comment over", async () => {
    const x = makeComment({ id: X, entityId: "entity-A", content: "from A" });
    const get = vi.spyOn(axiosPrivate, "get").mockImplementation((url: string) => {
      if (url.endsWith(`/comments/${X}`)) return ok(x);
      if (url.endsWith("/entities/entity-A")) return ok(makeEntity({ id: "entity-A" }));
      if (url.endsWith("/entities/entity-B")) return ok(makeEntity({ id: "entity-B" }));
      return ok(page([]));
    });
    const highlightFetches = () =>
      get.mock.calls.filter((c) => String(c[0]).endsWith(`/comments/${X}`)).length;

    const { result, rerender } = renderHookWithAxios(
      (p: { entityId: string }) =>
        useCommentSectionData({ entityId: p.entityId, highlightedCommentId: X }),
      { initialProps: { entityId: "entity-A" } } as any,
    );
    await waitFor(() => expect(result.current.highlightedComment?.comment.id).toBe(X));
    await waitFor(() => expect(result.current.entity?.id).toBe("entity-A"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.getComment(X)).toBeDefined();

    rerender({ entityId: "entity-B" });
    await waitFor(() => expect(result.current.entity?.id).toBe("entity-B"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(highlightFetches()).toBe(2));
    await new Promise((r) => setTimeout(r, 30));
    expect(result.current.highlightedComment).toBeNull();
    expect(result.current.getComment(X)).toBeUndefined();
    expect(result.current.comments).toEqual([]);
  });

  it("autoReaction takes only the reaction fields from the reaction response (it has no user)", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const created = makeComment({ id: G, user: { id: "user-1", username: "u" } as any });
    const { user: _u, ...reactionResponse } = makeComment({
      id: G,
      content: "server-side copy",
      userReaction: "upvote",
      reactionCounts: { upvote: 1, downvote: 0, like: 0, love: 0, wow: 0, sad: 0, angry: 0, funny: 0 } as any,
    });
    vi.spyOn(axiosPrivate, "get").mockImplementation(() => ok(page([])));
    vi.spyOn(axiosPrivate, "post").mockImplementation((url: string) =>
      url.includes("reactions") ? ok(reactionResponse) : ok(created),
    );
    const { result } = renderHookWithAxios(() => useCommentSectionData({ entity }), {
      user: makeAuthUser({ id: "user-1", username: "u" }),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.createComment({ content: "hello world", autoReaction: "upvote" });
    });
    await waitFor(() =>
      expect((axiosPrivate.post as any).mock.calls.some((c: any[]) => String(c[0]).includes("reactions"))).toBe(true),
    );
    await new Promise((r) => setTimeout(r, 30));
    const stored = result.current.newComments[0];
    expect(stored.userReaction).toBe("upvote");
    expect(stored.reactionCounts.upvote).toBe(1);
    expect(stored.user).toMatchObject({ id: "user-1", username: "u" });
    expect(stored.content).toBe(created.content);
  });

  describe("optimistic reply count when the parent is re-delivered mid-create", () => {
    async function setup() {
      const entity = makeEntity({ id: "entity-1" });
      let settle!: { resolve: (v: any) => void; reject: (e: any) => void };
      vi.spyOn(axiosPrivate, "get").mockImplementation(() =>
        ok(page([makeComment({ id: G, repliesCount: 2 })])),
      );
      vi.spyOn(axiosPrivate, "post").mockImplementation(
        () => new Promise((resolve, reject) => { settle = { resolve, reject }; }),
      );
      const rendered = renderHookWithAxios(
        () => useCommentSectionData({ entity, defaultSortBy: "createdAt" }),
        { user: makeAuthUser({ id: "user-1", username: "u" }) },
      );
      const { result } = rendered;
      await waitFor(() => expect(result.current.comments).toHaveLength(1));
      let pending!: Promise<unknown>;
      act(() => {
        pending = result.current.createComment({ parentId: G, content: "a reply" });
      });
      expect(result.current.getComment(G)?.repliesCount).toBe(3);
      // A sort change re-delivers the parent with the server's count (2).
      act(() => result.current.setSortBy("top"));
      await waitFor(() => expect(result.current.loading).toBe(false));
      return { result, settle: () => settle, pending: () => pending };
    }

    it("success ends one above the re-delivered count", async () => {
      const { result, settle, pending } = await setup();
      await act(async () => {
        settle().resolve({ data: makeComment({ id: X, parentId: G }), status: 201 });
        await pending();
      });
      expect(result.current.getComment(G)?.repliesCount).toBe(3);
    });

    it("failure leaves the re-delivered count alone", async () => {
      const { result, settle, pending } = await setup();
      await act(async () => {
        settle().reject(Object.assign(new Error("boom"), { response: { status: 500 } }));
        await pending();
      });
      expect(result.current.getComment(G)?.repliesCount).toBe(2);
    });
  });
});
