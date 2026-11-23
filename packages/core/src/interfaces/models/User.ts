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
  bio: string | null; // limited to 300 characters
  birthdate: string | null;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  } | null; // Optional location stored as GeoJSON
  metadata: Record<string, any>; // JSON object that could contain any other data about the user which is relevant to the project. Limited to 10KB size.
  secureMetadata: Record<string, any>; // Same as metadata only it is excluded when user is added to entity and comment data
  reputation: number; // Automatically managed by sublay based on usr activity
  spaceReputation?: number; // Per-space reputation, present only when a request opts in via `spaceReputation`
  isVerified: boolean; // Whether the user is verified
  isActive: boolean; // Whether the user account is active
  lastActive: string; // Timestamp for last activity
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
