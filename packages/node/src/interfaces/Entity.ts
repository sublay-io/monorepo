import { GrantSummary } from "./ReputationGrant";
import { Mention } from "./Mention";
import { User } from "./User";
import { Space, SpaceMemberRole, SpaceMemberStatus } from "./Space";
import { ReactionCounts, ReactionType } from "./Reaction";
import { File } from "./File";
import { Comment } from "./Comment";

/**
 * The viewer's saved state for an entity, present when the read requested
 * `include=saved`. `isSaved` is true when the entity is in at least one of the
 * viewer's collections; `collections` lists those collections in the order the
 * entity was saved into them. With no viewer: `{ isSaved: false, collections: [] }`.
 */
export interface EntitySaved {
  isSaved: boolean;
  collections: Array<{ id: string; name: string }>;
}

/**
 * The space attached by `include=space`. With a viewer it also carries the
 * viewer's membership in it: `isMember`, `userRole` and `userStatus` (`null`
 * when the viewer has no membership row).
 */
export type SpaceWithViewer = Space & {
  userRole?: SpaceMemberRole | null;
  userStatus?: SpaceMemberStatus | null;
};

export interface Entity {
  id: string;
  foreignId: string | null;
  shortId: string;
  sourceId: string | null;
  spaceId: string | null;
  space?: SpaceWithViewer | null; // Populated when include contains "space"; null with no space or one the viewer can't see
  // `userId`, `user`, `title`, `content`, `location`, `metadata` are `null`,
  // and `mentions`, `attachments`, `files`, `keywords` are `[]`, on
  // a moderator-removed entity, for everyone but its author (the placeholder).
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
  userReaction: ReactionType | null; // The viewer's reaction, or null
  commentsCount: number; // All of the entity's comments, at any depth
  sharesCount: number;
  views: number;
  score: number;
  scoreUpdatedAt: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  } | null;
  metadata: Record<string, any> | null; // `null` on the placeholder
  nsfw: boolean; // The entity's own NSFW flag
  nsfwEffective: boolean; // Computed live: entity.nsfw OR the entity's space's effective NSFW
  // Populated when include contains "topComments": the best top-level
  // comments (real content only). `[]` when none qualify.
  topComments?: Comment[];
  saved?: EntitySaved; // Populated when include contains "saved": the viewer's saved state
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

/**
 * The stored entity record only, without the computed and associated fields
 * an entity read adds.
 */
export type EntityRecord = Omit<
  Entity,
  | "commentsCount"
  | "userReaction"
  | "nsfwEffective"
  | "user"
  | "space"
  | "files"
  | "topComments"
  | "saved"
  | "grants"
>;

/** `include` values the entity fetches (by id, short id, foreign id, and lists) accept. */
export type EntityInclude =
  | "user"
  | "space"
  | "topComments"
  | "saved"
  | "files"
  | "grants";
export type EntityIncludeArray = EntityInclude[];
export type EntityIncludeParam = EntityInclude | EntityIncludeArray;

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
