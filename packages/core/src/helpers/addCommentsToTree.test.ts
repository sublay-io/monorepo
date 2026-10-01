import type { SetStateAction } from "react";
import { describe, it, expect } from "vitest";

import { makeComment } from "../test-utils";
import { addCommentsToTree } from "./addCommentsToTree";
import type { EntityCommentsTree } from "../interfaces/EntityCommentsTree";
import type { Comment } from "../interfaces/models/Comment";

// Applies addCommentsToTree batches to a plain tree, the way a state setter would.
function applyBatches(
  initial: EntityCommentsTree,
  batches: { comments: Comment[]; newlyAdded?: boolean }[],
): EntityCommentsTree {
  let tree = initial;
  const setTree = (value: SetStateAction<EntityCommentsTree>) => {
    tree = typeof value === "function" ? value(tree) : value;
  };
  for (const batch of batches) {
    addCommentsToTree(setTree, batch.comments, batch.newlyAdded);
  }
  return tree;
}

const root = makeComment({ id: "root", parentId: null });
const child = makeComment({ id: "child", parentId: "root" });
const grandchild = makeComment({ id: "grandchild", parentId: "child" });

describe("addCommentsToTree", () => {
  it("adds a new comment with no replies", () => {
    const tree = applyBatches({}, [{ comments: [root] }]);

    expect(tree.root).toEqual({ comment: root, replies: {}, new: false });
  });

  it("re-adding a comment keeps the replies already loaded under it", () => {
    const tree = applyBatches({}, [
      { comments: [root] },
      { comments: [child] },
      { comments: [grandchild] },
      // The parent's replies fetch returns `child` again.
      { comments: [child] },
    ]);

    expect(Object.keys(tree.child.replies)).toEqual(["grandchild"]);
    expect(Object.keys(tree.root.replies)).toEqual(["child"]);
  });

  it("re-adding a top-level comment keeps its replies", () => {
    const tree = applyBatches({}, [
      { comments: [root] },
      { comments: [child] },
      { comments: [root] },
    ]);

    expect(Object.keys(tree.root.replies)).toEqual(["child"]);
  });

  it("re-adding replaces the comment data and the new flag", () => {
    const updated = { ...child, content: "edited" };
    const tree = applyBatches({}, [
      { comments: [root] },
      { comments: [child], newlyAdded: true },
      { comments: [updated] },
    ]);

    expect(tree.child.comment.content).toBe("edited");
    expect(tree.child.new).toBe(false);
    expect(tree.root.replies.child).toMatchObject({ content: "edited", new: false });
  });

  it("ends with the same tree whichever replies fetch finishes first", () => {
    // `child` is already in the tree from the entity fetch, so the parent's
    // and the child's replies fetches run at the same time.
    const seeded = applyBatches({}, [{ comments: [root, child] }]);

    const childFirst = applyBatches(seeded, [
      { comments: [grandchild] },
      { comments: [child] },
    ]);
    const parentFirst = applyBatches(seeded, [
      { comments: [child] },
      { comments: [grandchild] },
    ]);

    expect(childFirst).toEqual(parentFirst);
    expect(Object.keys(childFirst.child.replies)).toEqual(["grandchild"]);
  });
});
