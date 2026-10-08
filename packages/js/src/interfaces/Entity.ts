import { GrantSummary } from "./ReputationGrant";
import { Mention } from "./Mention";
import { User } from "./User";
import { Space } from "./Space";
import { ReactionCounts, ReactionType } from "./Reaction";
import { File } from "./File";
import { Comment } from "./Comment";

export interface Entity {
  id: string;
  foreignId: string | null;
  shortId: string;
  projectId: string;
  sourceId: string | null;
  spaceId: string | null;
  space?: Space | null; // Populated when include contains "space"
  userId: string | null;
  user?: User | null;
  title: string | null;
  content: string | null;
  mentions: Mention[];
  attachments: Record<string, any>[];
  files?: File[]; // Populated when include contains "files"
  keywords: string[];
  upvotes: string[];   // Legacy v6 — v7 uses reactionCounts
  downvotes: string[]; // Legacy v6 — v7 uses reactionCounts
  reactionCounts: ReactionCounts;
  userReaction?: ReactionType | null; // Present when authenticated
  commentsCount: number; // All of the entity's comments, at any depth
  views: number;
  score: number;
  scoreUpdatedAt: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  } | null;
  metadata: Record<string, any>;
  nsfw: boolean; // The entity's own NSFW flag
  nsfwEffective: boolean; // Computed live: entity.nsfw OR the entity's space's effective NSFW
  // Populated when include contains "topComments": the best top-level
  // comments (real content only). `[]` when none qualify.
  topComments?: Comment[];
  isSaved?: boolean; // Populated when include contains "saved"
  /**
   * Reputation-grant summary. Opt-in — present exactly when the read requested
   * `include=grants`. Once requested the server always returns the object,
   * zero-filled rather than omitted, on projects with no grants and on projects
   * without the reputation bundle alike.
   */
  grants?: GrantSummary;
  isDraft: boolean | null;
  moderationStatus: "approved" | "removed" | null;
  moderatedAt: string | null;
  moderatedById: string | null;
  moderatedByType: "client" | "user" | null;
  moderationReason: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** `include` values the entity fetches (by id, short id, foreign id, and lists) accept. */
export type EntityInclude =
  | "user"
  | "space"
  | "topComments"
  | "saved"
  | "files"
  | "grants";

/** `include` values the collection-entities fetch accepts (no `saved`). */
export type CollectionEntityInclude = Exclude<EntityInclude, "saved">;
export type CollectionEntityIncludeArray = CollectionEntityInclude[];
export type CollectionEntityIncludeParam =
  | CollectionEntityInclude
  | CollectionEntityIncludeArray;

/** `include` values the drafts fetch accepts. */
export type DraftInclude = "user" | "space" | "files" | "grants";
export type DraftIncludeArray = DraftInclude[];
export type DraftIncludeParam = DraftInclude | DraftIncludeArray;

/** Options for `include=topComments` (rejected without that include). */
export interface TopCommentsParams {
  /** How many top comments per entity (default 1, max 5). */
  topCommentsLimit?: number;
  /** Which reaction's raw count ranks them (default "upvote"). */
  topCommentsSortByReaction?: ReactionType;
}
