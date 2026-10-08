import { GrantSummary } from "./ReputationGrant";
import { Entity } from "./Entity";
import { Mention } from "./Mention";
import { User } from "./User";
import { ReactionCounts, ReactionType } from "./Reaction";
import { CursorPaginatedResponse } from "./IPaginatedResponse";

export interface GifData {
  id: string;
  url: string;
  gifUrl: string;
  gifPreviewUrl: string;
  // The server's gif schema requires both as strings (aspectRatio is a string,
  // e.g. "1.5", not a number).
  altText: string;
  aspectRatio: string;
}

export interface Comment {
  id: string;
  projectId: string;
  foreignId: string | null;
  entityId: string;
  // Populated when include contains "entity" or "space". `null` on your own
  // comment on a post you can't see (its author blocked you).
  entity?: Entity | null;
  userId: string | null; // `null` on placeholders
  user?: User | null; // Populated when include contains "user"; `null` on placeholders
  parentId: string | null;
  // Populated when include contains "parent". `null` when the comment has no
  // parent, or the parent can't be shown to the viewer.
  parentComment?: Comment | null;
  content: string | null;
  gif: GifData | null;
  mentions: Mention[];
  attachments: Record<string, any>[]; // `[]` on placeholders
  upvotes: string[];   // Legacy v6 — v7 uses reactionCounts
  downvotes: string[]; // Legacy v6 — v7 uses reactionCounts
  reactionCounts: ReactionCounts;
  userReaction?: ReactionType | null; // Present when authenticated
  repliesCount: number;
  /**
   * Reputation-grant summary. Opt-in — present exactly when the read requested
   * `include=grants`. Once requested the server always returns the object,
   * zero-filled rather than omitted, on projects with no grants and on projects
   * without the reputation bundle alike.
   */
  grants?: GrantSummary;
  metadata: Record<string, any> | null; // `null` on placeholders
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  parentDeletedAt: string | null; // Legacy v6
  userDeletedAt: string | null;   // v7 user-initiated deletion (Reddit-style placeholder)
  moderationStatus: "approved" | "removed" | null;
  moderatedAt: string | null;
  moderatedById: string | null;
  moderatedByType: "client" | "user" | null;
  moderationReason: string | null;
  /**
   * The viewer blocked this comment's author, and the comment is returned in
   * full. Present on thread, history, single-comment, `topComments` and
   * reaction responses.
   */
  isAuthorBlocked?: boolean;
  /**
   * The comment exists but can't be shown to the viewer (a placeholder). The
   * server refuses replies and reactions on it.
   */
  isUnavailable?: boolean;
  /**
   * Nested replies — present only on thread fetches with `replyDepth > 0`;
   * absent at the depth boundary ("not fetched").
   */
  replies?: CursorPaginatedResponse<Comment>;
}

/** `include` values of a user's comment history and single-comment fetches. */
export type CommentInclude = "user" | "entity" | "space" | "parent" | "grants";
export type CommentIncludeArray = CommentInclude[];
export type CommentIncludeParam = CommentInclude | CommentIncludeArray;

/** `include` values the thread endpoint (`GET /comments`) accepts. */
export type CommentThreadInclude = "user" | "grants";
export type CommentThreadIncludeArray = CommentThreadInclude[];
export type CommentThreadIncludeParam =
  | CommentThreadInclude
  | CommentThreadIncludeArray;

/** Comment sorts. `new` / `old` are deprecated aliases of `createdAt`. */
export type CommentsSortBy =
  | "createdAt"
  | "top"
  | "controversial"
  /** @deprecated Use "createdAt" (with sortDir) instead. */
  | "new"
  /** @deprecated Use "createdAt" with sortDir:"asc" instead. */
  | "old";

/** Sorts for the nested reply levels (no deprecated aliases). */
export type CommentReplySortBy = "createdAt" | "top" | "controversial";
