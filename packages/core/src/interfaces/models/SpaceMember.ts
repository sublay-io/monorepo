import { PaginatedResponse } from "../PaginatedResponse";

export type SpaceMemberRole = "admin" | "moderator" | "member";
export type SpaceMemberStatus = "pending" | "active" | "banned" | "rejected";

/**
 * A membership record: what the member actions (join, add, approve, decline,
 * ban, unban, role change) return.
 */
export interface SpaceMember {
  id: string;
  spaceId: string;
  userId: string;
  role: SpaceMemberRole;
  status: SpaceMemberStatus;
  joinedAt: string;
  createdAt: string;
}

// Space member with user information (returned from fetchSpaceMembers)
export interface SpaceMemberWithUser {
  membershipId: string;
  role: SpaceMemberRole;
  status: SpaceMemberStatus;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    metadata: object;
    // Excludes: hash, salt, email, isVerified, isActive, lastActive, secureMetadata
  };
}

export type SpaceMembersResponse = PaginatedResponse<SpaceMemberWithUser>;

