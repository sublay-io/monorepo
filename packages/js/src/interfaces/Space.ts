import { PaginatedResponse } from "./IPaginatedResponse";
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
  avatarFile?: File;
}

export interface Space {
  id: string;
  projectId: string;
  shortId: string;
  slug: string | null;
  name: string;
  description: string | null;
  avatarFileId: string | null;
  bannerFileId: string | null;
  userId: string;
  readingPermission: ReadingPermission;
  postingPermission: PostingPermission;
  visibility: SpaceVisibility;
  requireJoinApproval: boolean;
  nsfw: boolean; // The space's own NSFW flag
  nsfwEffective: boolean; // Denormalized: own nsfw OR any ancestor space's nsfw
  parentSpaceId: string | null;
  depth: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  membersCount: number;
  childSpacesCount: number;
  isMember?: boolean; // Only present when user is authenticated
  avatarFile?: File;
  bannerFile?: File;
}

// Returned from create and update — the space plus the caller's permissions in it
export interface SpaceWithPermissions extends Space {
  /**
   * What the viewer may do in the space, from the same calculation the
   * server's routes enforce. Always present. It describes a viewer, not what
   * an app backend may write: signed out, or a service key naming no user,
   * gets the anonymous view.
   */
  memberPermissions: SpaceMemberPermissions;
}

// Returned from single-space fetch endpoints — extends Space with extra context
export interface SpaceDetailed extends SpaceWithPermissions {
  parentSpace: SpacePreview | null;
  childSpaces: SpacePreview[];
}

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

export interface JoinSpaceResponse {
  message: string;
  membership: {
    id: string;
    spaceId: string;
    userId: string;
    role: "member";
    status: "pending" | "active";
    joinedAt: string;
  };
  /** The joiner's permissions in the space after joining. */
  memberPermissions: SpaceMemberPermissions;
}

export interface LeaveSpaceResponse {
  message: string;
  /** The caller's permissions in the space after leaving, now as a non-member. */
  memberPermissions: SpaceMemberPermissions;
}

export interface UpdateMemberRoleResponse {
  message: string;
  membership: {
    id: string;
    role: SpaceMemberRole;
    status: string;
    joinedAt: string;
    userId: string;
  };
}

export interface ApproveMemberResponse {
  message: string;
  membership: {
    id: string;
    status: "active";
    joinedAt: string;
  };
}

export interface AddMemberResponse {
  /** "User added to the space." or, when they were already an active member, "User is already a member of this space." */
  message: string;
  membership: {
    id: string;
    spaceId: string;
    userId: string;
    /** `member` for a user just added; an existing active member keeps their role. */
    role: SpaceMemberRole;
    status: "active";
    joinedAt: string;
    createdAt: string;
  };
}

export interface DeclineMemberResponse {
  message: string;
  membership: {
    id: string;
    status: "rejected";
  };
}

/**
 * The caller's standing in a space. A field that describes a relationship the
 * caller doesn't have is absent (never `null`): `status` only when a
 * membership row exists, `role` and `joinedAt` only when `isMember` is true.
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

// The server replies with `{ message }` only — it does not echo the deleted
// space or any per-table counts.
export interface DeleteSpaceResponse {
  message: string;
}

/** A space on the path that the viewer can see. */
export interface VisibleSpaceBreadcrumbEntry {
  id: string;
  shortId: string;
  name: string;
  slug: string | null;
  avatarFileId: string | null;
  visibility: SpaceVisibility;
  parentSpaceId: string | null;
  depth: number;
  hidden: false;
}

/**
 * A space above the requested one that the viewer can't see (a private space
 * they aren't an active member of, or one under it). Carries nothing else.
 */
export interface HiddenSpaceBreadcrumbEntry {
  hidden: true;
}

export type SpaceBreadcrumbEntry =
  | VisibleSpaceBreadcrumbEntry
  | HiddenSpaceBreadcrumbEntry;

export interface SpaceBreadcrumb {
  /** The path from the top-level space down to the requested one, root first. */
  breadcrumb: SpaceBreadcrumbEntry[];
  depth: number;
}

/** `include` values every space read (single, lists, user spaces, mutual) accepts. */
export type SpaceInclude = "files";
export type SpaceIncludeArray = SpaceInclude[];
export type SpaceIncludeParam = SpaceInclude | SpaceIncludeArray;
