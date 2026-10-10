import { Entity } from "./Entity";
import { Mention } from "./Mention";
import { User } from "./User";
import { ReactionCounts, ReactionType } from "./Reaction";
import { GrantSummary } from "./ReputationGrant";
import { CursorPaginatedResponse } from "../PaginatedResponse";

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
  id: string; // Sequelize auto-generates this
  foreignId: string | null;
  entityId: string; // Required
  spaceId: string | null; // The space of the comment's entity, if any
  // Optional - included when include contains "entity" or "space". `null`
  // on your own comment on a post you can't see (its author blocked you).
  entity?: Entity | null;
  // `null` on placeholders (user-deleted, removed for others, unavailable).
  userId: string | null;
  user?: User | null; // Optional - included when include contains "user"; `null` on placeholders
  parentId: string | null; // Optional parent comment (if it's a reply)
  // Optional - included when include contains "parent". `null` when the
  // comment has no parent, or the parent can't be shown to you.
  parentComment?: Comment | null;
  referencedCommentId: string | null; // The comment this one quotes, if any
  content: string | null; // Required
  gif: GifData | null;
  mentions: Mention[];
  attachments: Record<string, any>[]; // `[]` on placeholders
  upvotes: string[]; // Array of user IDs (v6 legacy - v7 uses reactionCounts)
  downvotes: string[]; // Array of user IDs (v6 legacy - v7 uses reactionCounts)
  reactionCounts: ReactionCounts; // v7 reaction system - counts for all 8 reaction types
  userReaction?: ReactionType | null; // v7 - current user's reaction (populated when authenticated)
  repliesCount: number; // Count of replies
  grants?: GrantSummary; // Optional - reputation-grant summary, populated when include contains "grants". Zero-filled (never omitted) on projects without the grants table.
  metadata: Record<string, any> | null; // JSON object that could contain any other data about the comment which is relevant. Limited to 10KB size. `null` on placeholders.
  createdAt: string; // Timestamp for creation
  updatedAt: string; // Timestamp for updating
  deletedAt: string | null; // Timestamp for updating
  // Legacy v6 field: set on children when their parent was paranoid-deleted.
  // Not used by v7 (which uses userDeletedAt). Can be removed once v6 is
  // retired and legacy data is cleaned up.
  parentDeletedAt: string | null;
  userDeletedAt: string | null; // Timestamp for user-initiated deletion (Reddit-style placeholder)
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
   * Nested replies — present only on thread fetches with `replyDepth > 0`, and
   * absent at the depth boundary ("not fetched"; `data: []` means "fetched,
   * none").
   */
  replies?: CursorPaginatedResponse<Comment>;
}

export type CommentInclude =
  | "user"
  | "entity"
  | "space"
  | "parent"
  | "grants";
export type CommentIncludeArray = CommentInclude[];
export type CommentIncludeParam = CommentInclude | CommentIncludeArray;

/** `include` values the thread endpoint (`GET /comments`) accepts. */
export type CommentThreadInclude = "user" | "grants";
export type CommentThreadIncludeArray = CommentThreadInclude[];
export type CommentThreadIncludeParam =
  | CommentThreadInclude
  | CommentThreadIncludeArray;
