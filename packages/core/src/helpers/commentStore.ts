import { Comment } from "../interfaces/models/Comment";
import { CursorPaginatedResponse } from "../interfaces/PaginatedResponse";

/**
 * The comment section's internal store (plan §5.3, D16, D20).
 *
 * Every comment is stored once, keyed by id. A node's children are ordered,
 * de-duplicated ids (`childIds`) rather than copies, so an update to a comment
 * is seen everywhere it's rendered. Alongside the nodes, `rootIds` is the
 * ordered top-level list under the same rules. Detached subtree roots (a reply
 * whose parent isn't in the store) are kept as nodes but are not in `rootIds`.
 *
 * Every function here is pure: it takes a store and returns a new one (or the
 * same one when nothing changed).
 */
export interface CommentNode {
  /** The comment, with any nested `replies` stripped. */
  comment: Comment;
  /** Ordered, de-duplicated ids of this comment's loaded replies. */
  childIds: string[];
  /** Posted by the viewer during this session. */
  new: boolean;
  failed?: boolean;
  /** Where "load more replies" continues. */
  repliesCursor: string | null;
  /** `false` = this comment's replies were never fetched. */
  repliesLoaded: boolean;
  /** Meaningful once `repliesLoaded`; see `nodeRepliesHasMore`. */
  repliesHasMore: boolean;
}

export interface CommentStore {
  nodes: Record<string, CommentNode>;
  rootIds: string[];
}

export const emptyCommentStore = (): CommentStore => ({ nodes: {}, rootIds: [] });

/** The comment without its nested `replies` envelope. */
export function stripNestedReplies(comment: Comment): Comment {
  if (!("replies" in comment)) return comment;
  const { replies: _replies, ...rest } = comment;
  return rest as Comment;
}

function appendUnique(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids : [...ids, id];
}

interface UpsertOptions {
  newlyAdded?: boolean;
}

/**
 * Insert or refresh one comment (no recursion into `replies` — the caller
 * flattens). Rules:
 * - a re-arriving comment refreshes `comment` only; its replies cursor,
 *   loaded flag and hasMore never move backwards. Exception: a node whose
 *   replies were never loaded adopts the incoming nested cursor/hasMore.
 * - `new` is sticky: an own new comment stays new when a fetch returns it.
 * - the comment is linked under its parent when the parent is in the store
 *   (or added to `rootIds` when it's top-level); otherwise it's a detached
 *   subtree root.
 */
function upsertOne(
  store: CommentStore,
  incoming: Comment,
  options: UpsertOptions,
): CommentStore {
  const nested = incoming.replies;
  const comment = stripNestedReplies(incoming);
  const existing = store.nodes[comment.id];

  let node: CommentNode;
  if (existing) {
    node = {
      ...existing,
      comment,
      new: existing.new || !!options.newlyAdded,
    };
    if (!existing.repliesLoaded && nested) {
      node.repliesLoaded = true;
      node.repliesCursor = nested.pagination.nextCursor;
      node.repliesHasMore = nested.pagination.hasMore;
    }
  } else {
    node = {
      comment,
      childIds: [],
      new: !!options.newlyAdded,
      repliesLoaded: !!nested,
      repliesCursor: nested ? nested.pagination.nextCursor : null,
      repliesHasMore: nested ? nested.pagination.hasMore : false,
    };
  }

  const nodes = { ...store.nodes, [comment.id]: node };
  let rootIds = store.rootIds;

  if (comment.parentId) {
    const parent = nodes[comment.parentId];
    if (parent && !parent.childIds.includes(comment.id)) {
      nodes[comment.parentId] = {
        ...parent,
        childIds: [...parent.childIds, comment.id],
      };
    }
  } else {
    rootIds = appendUnique(rootIds, comment.id);
  }

  return { nodes, rootIds };
}

/**
 * Insert comments in order, flattening each one's nested `replies`
 * parent-first (so every nested reply finds its parent already stored).
 */
export function insertComments(
  store: CommentStore,
  comments: Comment[] | undefined,
  options: UpsertOptions = {},
): CommentStore {
  if (!comments || comments.length === 0) return store;
  let next = store;
  const walk = (list: Comment[]) => {
    for (const comment of list) {
      next = upsertOne(next, comment, options);
      if (comment.replies?.data?.length) walk(comment.replies.data);
    }
  };
  walk(comments);
  return next;
}

/**
 * Store a page of a comment's direct replies (a `parentId` fetch): insert them
 * under the parent and move the parent's replies cursor forward. Unlike a
 * re-arrival, this is the parent's own "load more", so its cursor/hasMore are
 * replaced and it's marked loaded.
 */
export function applyRepliesPage(
  store: CommentStore,
  parentId: string,
  page: CursorPaginatedResponse<Comment>,
): CommentStore {
  // Replies whose parent isn't stored still go in (detached), but there's no
  // node to move forward.
  let next = insertComments(store, page.data);
  const parent = next.nodes[parentId];
  if (!parent) return next;
  next = {
    ...next,
    nodes: {
      ...next.nodes,
      [parentId]: {
        ...parent,
        repliesLoaded: true,
        repliesCursor: page.pagination.nextCursor,
        repliesHasMore: page.pagination.hasMore,
      },
    },
  };
  return next;
}

/**
 * Insert a deep-linked comment: the parent first, then the target. The parent
 * lists the target as a child and — unless its replies were already loaded —
 * stays "not loaded", so it has more to load exactly when its `repliesCount`
 * exceeds what it already shows (see `nodeRepliesHasMore`); its first "load
 * replies" fetches normally and de-duplication keeps the target from
 * appearing twice.
 */
export function insertHighlightedComment(
  store: CommentStore,
  target: Comment,
  parent: Comment | null,
): CommentStore {
  let next = store;
  if (parent) next = insertComments(next, [stripNestedReplies(parent)]);
  next = insertComments(next, [stripNestedReplies(target)]);
  return next;
}

/** Remove a comment and its whole subtree. Safe on missing ids. */
export function removeComment(store: CommentStore, commentId: string): CommentStore {
  const node = store.nodes[commentId];
  if (!node) return store;

  const nodes = { ...store.nodes };
  const stack = [commentId];
  while (stack.length) {
    const id = stack.pop()!;
    const current = nodes[id];
    if (!current) continue;
    stack.push(...current.childIds);
    delete nodes[id];
  }

  const parentId = node.comment.parentId;
  if (parentId && nodes[parentId]) {
    nodes[parentId] = {
      ...nodes[parentId],
      childIds: nodes[parentId].childIds.filter((id) => id !== commentId),
    };
  }

  return {
    nodes,
    rootIds: store.rootIds.includes(commentId)
      ? store.rootIds.filter((id) => id !== commentId)
      : store.rootIds,
  };
}

/** Apply `update` to one stored comment. No-op on a missing id. */
export function patchComment(
  store: CommentStore,
  commentId: string,
  update: (comment: Comment) => Comment,
): CommentStore {
  const node = store.nodes[commentId];
  if (!node) return store;
  return {
    ...store,
    nodes: {
      ...store.nodes,
      [commentId]: { ...node, comment: stripNestedReplies(update(node.comment)) },
    },
  };
}

/**
 * Optimistic user-delete: the comment stays as a placeholder (its replies stay
 * intact) with the same fields blanked as the server's placeholder (§3.7).
 */
export function markCommentDeleted(store: CommentStore, commentId: string): CommentStore {
  return patchComment(store, commentId, (comment) => ({
    ...comment,
    userDeletedAt: new Date().toISOString(),
    userId: null,
    user: null,
    content: null,
    gif: null,
    metadata: null,
    mentions: [],
    attachments: [],
  }));
}

/** Replies already shown under a comment whose replies were never fetched. */
function shownChildCount(store: CommentStore, node: CommentNode): number {
  return node.childIds.filter((id) => store.nodes[id]).length;
}

/**
 * Whether "load more replies" has anything to fetch. A comment whose replies
 * were never fetched has more when `repliesCount` exceeds the replies it
 * already shows — the viewer's own new replies and, for a highlighted
 * comment's parent, the highlighted reply (so a comment whose only reply is
 * your own, or the highlighted one, doesn't show "View replies").
 */
export function nodeRepliesHasMore(store: CommentStore, commentId: string): boolean {
  const node = store.nodes[commentId];
  if (!node) return false;
  if (node.repliesLoaded) return node.repliesHasMore;
  return (node.comment.repliesCount ?? 0) > shownChildCount(store, node);
}

const byCreatedAtDesc = (a: Comment, b: Comment) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

/** Top-level comments: fetched ones in order, and the viewer's new ones newest-first. */
export function selectRootComments(store: CommentStore): {
  comments: Comment[];
  newComments: Comment[];
} {
  const comments: Comment[] = [];
  const newComments: Comment[] = [];
  for (const id of store.rootIds) {
    const node = store.nodes[id];
    if (!node) continue;
    (node.new ? newComments : comments).push(node.comment);
  }
  newComments.sort(byCreatedAtDesc);
  return { comments, newComments };
}

/** A comment's loaded replies, split like the top level. */
export function selectReplies(
  store: CommentStore,
  commentId: string,
): { replies: Comment[]; newReplies: Comment[] } {
  const node = store.nodes[commentId];
  if (!node) return { replies: [], newReplies: [] };
  const replies: Comment[] = [];
  const newReplies: Comment[] = [];
  for (const id of node.childIds) {
    const child = store.nodes[id];
    if (!child) continue;
    (child.new ? newReplies : replies).push(child.comment);
  }
  newReplies.sort(byCreatedAtDesc);
  return { replies, newReplies };
}
