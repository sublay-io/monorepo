import { PaginatedResponse, PaginationMetadata } from "../PaginatedResponse";
import { File } from "./File";

export type ReadingPermission = "anyone" | "members";
// "team" = the space's active admins and moderators.
export type PostingPermission = "anyone" | "members" | "team";
export type SpaceVisibility = "public" | "unlisted" | "private";

export type SpaceMemberRole = "admin" | "moderator" | "member";
export type SpaceMemberStatus = "pending" | "active" | "banned" | "rejected";

export interface SpaceMemberPermissions {
  isAdmin: boolean;
  isModerator: boolean;
  isMember: boolean;
  status: "pending" | "active" | "banned" | "rejected" | null;
  canPost: boolean;
  canModerate: boolean;
  canRead: boolean;
}
export type PaginationMeta = PaginationMetadata;

export interface SpacePreview {
  id: string;
  shortId: string;
  name: string;
  slug: string | null;
  avatarFileId: string | null;
  readingPermission?: ReadingPermission;
  visibility?: SpaceVisibility;
  parentSpaceId?: string | null;
  depth?: number;

  // File associations (populated via joins)
  avatarFile?: File;
}

export interface Space {
  // Core identifiers
  id: string;
  projectId: string;
  shortId: string;
  slug: string | null;

  // Display info
  name: string;
  description: string | null;
  avatarFileId: string | null;
  bannerFileId: string | null;

  // Ownership & permissions
  userId: string;
  readingPermission: ReadingPermission;
  postingPermission: PostingPermission;
  visibility: SpaceVisibility;
  requireJoinApproval: boolean;

  // NSFW
  nsfw: boolean; // The space's own NSFW flag
  nsfwEffective: boolean; // Denormalized: own nsfw OR any ancestor space's nsfw

  // Hierarchy
  parentSpaceId: string | null;
  depth: number;

  // Metadata
  metadata: Record<string, any>;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  // Computed fields
  membersCount: number;
  childSpacesCount: number;
  isMember?: boolean; // Optional: only present when user is authenticated

  // File associations (populated via joins)
  avatarFile?: File;
  bannerFile?: File;
}

// A space with the caller's permissions in it (returned from create and update)
export interface SpaceWithPermissions extends Space {
  /**
   * What the viewer may do in the space, from the same calculation the
   * server's routes enforce. Always present. It describes a viewer, not what
   * an app backend may write: signed out, or a service key naming no user,
   * gets the anonymous view.
   */
  memberPermissions: SpaceMemberPermissions;
}

// Extended space with detailed information (returned from single space fetch endpoints)
export interface SpaceDetailed extends SpaceWithPermissions {
  // Parent space information (always included, null if root space)
  parentSpace: SpacePreview | null;

  // Child spaces preview (always included, empty array if no children)
  childSpaces: SpacePreview[];
}

// My Spaces response types
export interface MySpaceItem {
  space: Space;
  membership: {
    membershipId: string;
    role: SpaceMemberRole;
    status: SpaceMemberStatus;
    joinedAt: string;
  };
}

export type MySpacesResponse = PaginatedResponse<MySpaceItem>;

/**
 * `GET /spaces/:spaceId/members/me`. Fields that describe a membership the
 * caller doesn't have are left out, never sent as null: `status` is present
 * only when a membership row exists (whatever its status), `role` and
 * `joinedAt` only when `isMember` is true.
 */
export interface CheckMyMembershipResponse {
  isMember: boolean;
  role?: "admin" | "moderator" | "member";
  status?: "pending" | "active" | "banned" | "rejected";
  joinedAt?: string;
  permissions: {
    canPost: boolean;
    canModerate: boolean;
    canRead: boolean;
    isAdmin: boolean;
    isModerator: boolean;
  };
}

/** `include` values every space read (single, lists, user spaces, mutual) accepts. */
export type SpaceInclude = "files";
export type SpaceIncludeArray = SpaceInclude[];
export type SpaceIncludeParam = SpaceInclude | SpaceIncludeArray;
