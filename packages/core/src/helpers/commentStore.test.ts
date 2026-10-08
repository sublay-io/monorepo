import { describe, it, expect } from "vitest";

import { makeComment } from "../test-utils";
import type { Comment } from "../interfaces/models/Comment";
import {
  applyRepliesPage,
  emptyCommentStore,
  insertComments,
  insertHighlightedComment,
  markCommentDeleted,
  nodeRepliesHasMore,
  patchComment,
  removeComment,
  selectReplies,
  selectRootComments,
} from "./commentStore";

const page = (data: Comment[], nextCursor: string | null) => ({
  data,
  pagination: { nextCursor, hasMore: nextCursor !== null },
});

describe("commentStore", () => {
  it("stores each comment once and lists roots in arrival order", () => {
    const a = makeComment({ id: "a" });
    const b = makeComment({ id: "b" });
    let store = insertComments(emptyCommentStore(), [a, b]);
    // A vote-ranked page overlapping the previous one re-delivers `a`.
    store = insertComments(store, [makeComment({ id: "a", content: "edited" }), makeComment({ id: "c" })]);

    expect(store.rootIds).toEqual(["a", "b", "c"]);
    expect(Object.keys(store.nodes)).toHaveLength(3);
    expect(store.nodes.a.comment.content).toBe("edited");
  });

  it("flattens nested replies parent-first and strips the nested copies", () => {
    const r1a = makeComment({ id: "r1a", parentId: "r1" });
    const r1 = makeComment({ id: "r1", parentId: "c1", replies: page([r1a], null) });
    const c1 = makeComment({ id: "c1", repliesCount: 7, replies: page([r1], "cur-c1") });

    const store = insertComments(emptyCommentStore(), [c1]);

    expect(store.rootIds).toEqual(["c1"]);
    expect(store.nodes.c1.childIds).toEqual(["r1"]);
    expect(store.nodes.r1.childIds).toEqual(["r1a"]);
    expect(store.nodes.c1.comment).not.toHaveProperty("replies");
    expect(store.nodes.r1.comment).not.toHaveProperty("replies");
    expect(store.nodes.c1).toMatchObject({
      repliesLoaded: true,
      repliesCursor: "cur-c1",
      repliesHasMore: true,
    });
    // r1a sits at the depth boundary: never fetched.
    expect(store.nodes.r1a.repliesLoaded).toBe(false);
  });

  it("a re-arriving comment refreshes its data but never moves its replies state backwards", () => {
    const c1 = makeComment({ id: "c1", repliesCount: 40 });
    let store = insertComments(emptyCommentStore(), [c1]);
    store = applyRepliesPage(store, "c1", page([makeComment({ id: "r1", parentId: "c1" })], "cur-30"));

    // A later page re-delivers c1 with a fresh (earlier) nested preview.
    store = insertComments(store, [
      makeComment({
        id: "c1",
        repliesCount: 41,
        replies: page([makeComment({ id: "r1", parentId: "c1" })], "cur-1"),
      }),
    ]);

    expect(store.nodes.c1.comment.repliesCount).toBe(41);
    expect(store.nodes.c1.repliesCursor).toBe("cur-30");
    expect(store.nodes.c1.childIds).toEqual(["r1"]);
  });

  it("a never-loaded node adopts the cursor of an incoming nested copy", () => {
    let store = insertComments(emptyCommentStore(), [makeComment({ id: "c1", repliesCount: 5 })]);
    expect(store.nodes.c1.repliesLoaded).toBe(false);

    store = insertComments(store, [
      makeComment({ id: "c1", repliesCount: 5, replies: page([makeComment({ id: "r1", parentId: "c1" })], "cur") }),
    ]);

    expect(store.nodes.c1).toMatchObject({
      repliesLoaded: true,
      repliesCursor: "cur",
      repliesHasMore: true,
      childIds: ["r1"],
    });
  });

  it("childIds never hold an id twice; a re-arriving child keeps its position", () => {
    let store = insertComments(emptyCommentStore(), [makeComment({ id: "c1" })]);
    store = applyRepliesPage(store, "c1", page([
      makeComment({ id: "r1", parentId: "c1" }),
      makeComment({ id: "r2", parentId: "c1" }),
    ], "x"));
    store = applyRepliesPage(store, "c1", page([
      makeComment({ id: "r2", parentId: "c1" }),
      makeComment({ id: "r3", parentId: "c1" }),
    ], null));

    expect(store.nodes.c1.childIds).toEqual(["r1", "r2", "r3"]);
    expect(store.nodes.c1.repliesHasMore).toBe(false);
  });

  it("own new replies stay in newReplies when a fetch returns them", () => {
    let store = insertComments(emptyCommentStore(), [makeComment({ id: "c1", repliesCount: 2 })]);
    store = insertComments(store, [makeComment({ id: "mine", parentId: "c1" })], { newlyAdded: true });
    store = applyRepliesPage(store, "c1", page([
      makeComment({ id: "mine", parentId: "c1" }),
      makeComment({ id: "other", parentId: "c1" }),
    ], null));

    const { replies, newReplies } = selectReplies(store, "c1");
    expect(newReplies.map((c) => c.id)).toEqual(["mine"]);
    expect(replies.map((c) => c.id)).toEqual(["other"]);
  });

  it("initial hasMore discounts the viewer's own new replies", () => {
    let store = insertComments(emptyCommentStore(), [makeComment({ id: "c1", repliesCount: 0 })]);
    expect(nodeRepliesHasMore(store, "c1")).toBe(false);

    // Optimistic +1 for the viewer's own reply (D24).
    store = patchComment(store, "c1", (c) => ({ ...c, repliesCount: 1 }));
    store = insertComments(store, [makeComment({ id: "mine", parentId: "c1" })], { newlyAdded: true });
    expect(nodeRepliesHasMore(store, "c1")).toBe(false);

    store = patchComment(store, "c1", (c) => ({ ...c, repliesCount: 2 }));
    expect(nodeRepliesHasMore(store, "c1")).toBe(true);
  });

  it("keeps a reply whose parent isn't stored as a detached subtree root", () => {
    const store = insertComments(emptyCommentStore(), [
      makeComment({ id: "orphan", parentId: "missing" }),
    ]);
    expect(store.nodes.orphan).toBeDefined();
    expect(store.rootIds).toEqual([]);
    expect(selectRootComments(store).comments).toEqual([]);
  });

  it("inserts a highlighted comment parent-first, keeping the parent unloaded with more to load", () => {
    const parent = makeComment({ id: "p", repliesCount: 4 });
    const target = makeComment({ id: "t", parentId: "p" });
    let store = insertHighlightedComment(emptyCommentStore(), target, parent);

    expect(store.nodes.p.childIds).toEqual(["t"]);
    expect(store.nodes.p.repliesLoaded).toBe(false);
    expect(nodeRepliesHasMore(store, "p")).toBe(true);

    // The parent's first normal load re-delivers the target: no duplicate.
    store = applyRepliesPage(store, "p", page([
      makeComment({ id: "x", parentId: "p" }),
      makeComment({ id: "t", parentId: "p" }),
    ], null));
    expect(store.nodes.p.childIds).toEqual(["t", "x"]);
  });

  it("a highlighted comment whose parent sits deeper is kept even though the parent is detached", () => {
    const parent = makeComment({ id: "p", parentId: "grandparent" });
    const target = makeComment({ id: "t", parentId: "p" });
    const store = insertHighlightedComment(emptyCommentStore(), target, parent);
    expect(store.nodes.p.childIds).toEqual(["t"]);
    expect(store.rootIds).toEqual([]);
  });

  it("removal walks the whole subtree and is safe on missing ids", () => {
    let store = insertComments(emptyCommentStore(), [
      makeComment({
        id: "c1",
        replies: page([
          makeComment({ id: "r1", parentId: "c1", replies: page([makeComment({ id: "r1a", parentId: "r1" })], null) }),
        ], null),
      }),
    ]);
    store = removeComment(store, "r1");
    expect(store.nodes.r1).toBeUndefined();
    expect(store.nodes.r1a).toBeUndefined();
    expect(store.nodes.c1.childIds).toEqual([]);

    expect(removeComment(store, "nope")).toBe(store);
    store = removeComment(store, "c1");
    expect(store.rootIds).toEqual([]);
    expect(store.nodes).toEqual({});
  });

  it("an optimistic delete blanks the same fields as the server placeholder", () => {
    let store = insertComments(emptyCommentStore(), [
      makeComment({
        id: "c1",
        content: "hi",
        metadata: { a: 1 },
        attachments: [{ url: "x" }],
        mentions: [{ type: "user", id: "u", username: "u" } as never],
      }),
    ]);
    store = markCommentDeleted(store, "c1");
    expect(store.nodes.c1.comment).toMatchObject({
      userId: null,
      user: null,
      content: null,
      gif: null,
      metadata: null,
      mentions: [],
      attachments: [],
    });
    expect(store.nodes.c1.comment.userDeletedAt).not.toBeNull();
    expect(markCommentDeleted(store, "missing")).toBe(store);
  });

  it("new top-level comments are listed newest-first, apart from fetched ones", () => {
    let store = insertComments(emptyCommentStore(), [makeComment({ id: "old" })]);
    store = insertComments(store, [makeComment({ id: "n1", createdAt: "2024-01-01T00:00:00.000Z" })], { newlyAdded: true });
    store = insertComments(store, [makeComment({ id: "n2", createdAt: "2024-02-01T00:00:00.000Z" })], { newlyAdded: true });
    const { comments, newComments } = selectRootComments(store);
    expect(comments.map((c) => c.id)).toEqual(["old"]);
    expect(newComments.map((c) => c.id)).toEqual(["n2", "n1"]);
  });
});
