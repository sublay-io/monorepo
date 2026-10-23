import { File } from "./File";

export type UserRole = "admin" | "moderator" | "visitor";
export type UserFull = {
  id: string;
  projectId: string;
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
  spaceReputation?: number; // Per-space reputation, present only when a request opts in via `spaceReputationId`
  isVerified: boolean; // Whether the user is verified
  isActive: boolean; // Whether the user account is active
  lastActive: string; // Timestamp for last activity
  createdAt: string;
  updatedAt: string;
};

// These are the details the get delivered to the authenticated user's client (about themselves)
export type AuthUser = Omit<UserFull, "secureMetadata"> & {
  suspensions: {
    reason: string | null;
    startDate: string;
    endDate: string | null;
  }[];
  authMethods: string[]; // e.g. ["password", "google", "github"]
};

// This is used in some places where we need to return a user object to the client, either of themselves or of someone else.
export type User = Omit<
  UserFull,
  | "email"
  | "secureMetadata"
  | "isVerified"
  | "isActive"
  | "lastActive"
  | "updatedAt"
>;

/** `include` values the user fetches (by id, foreign id, username) accept. */
export type UserInclude = "files";
export type UserIncludeArray = UserInclude[];
export type UserIncludeParam = UserInclude | UserIncludeArray;
