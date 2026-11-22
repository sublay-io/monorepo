import { File } from "./File";

export type UserRole = "admin" | "moderator" | "visitor";

export type UserFull = {
  id: string;
  foreignId: string | null;
  role: UserRole;
  email: string | null;
  name: string | null;
  username: string | null;
  avatar: string | null;
  avatarFileId: string | null;
  bannerFileId: string | null;
  avatarFile?: File | null;
  bannerFile?: File | null;
  bio: string | null; // Max 300 characters
  birthdate: string | null;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  } | null;
  metadata: Record<string, any>;
  secureMetadata: Record<string, any>; // Excluded from public responses
  reputation: number;
  /**
   * Space-scoped reputation, present only when the request opted in via
   * `spaceReputation` (and the project has the reputation bundle). It is the
   * user's reputation within the requested space context — see
   * {@link SpaceReputationContextParams} / {@link SpaceReputationUserParams}.
   */
  spaceReputation?: number;
  isVerified: boolean;
  isActive: boolean;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
};

// One of the authenticated user's active suspensions.
export interface UserSuspension {
  id: string;
  userId: string;
  reason: string;
  startDate: string;
  endDate: string | null; // null for an open-ended suspension
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// Returned to the authenticated user about themselves (sign-up, sign-in,
// token refresh, external-user verification, profile update)
export type AuthUser = Pick<
  UserFull,
  | "id"
  | "foreignId"
  | "role"
  | "email"
  | "name"
  | "username"
  | "avatar"
  | "bio"
  | "metadata"
  | "reputation"
  | "isVerified"
  | "isActive"
  | "lastActive"
  | "createdAt"
> & {
  suspensions: UserSuspension[]; // Active suspensions; empty when there are none
  avatarFile: File | null; // null when there is none or the files-images bundle isn't installed
  bannerFile: File | null;
  authMethods: string[]; // e.g. ["password", "google", "github"]
};

// Returned in public contexts (e.g. nested on entities/comments)
export type User = Omit<
  UserFull,
  "email" | "secureMetadata" | "isVerified" | "isActive" | "lastActive"
>;

/** `include` values the user fetches (by id, foreign id, username) accept. */
export type UserInclude = "files";
export type UserIncludeArray = UserInclude[];
export type UserIncludeParam = UserInclude | UserIncludeArray;

// The short user attached to chat messages, reactions and conversation
// previews: only these attributes, plus `spaceReputation` when requested.
export type UserSummary = {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  reputation: number;
  spaceReputation?: number;
};
