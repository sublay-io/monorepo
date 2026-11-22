import { PaginatedResponse } from "./IPaginatedResponse";
import { SpaceMemberRole, SpaceMemberStatus } from "./Space";
import { User } from "./User";

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

// Returned from fetchSpaceMembers
export interface SpaceMemberWithUser {
  membershipId: string;
  role: SpaceMemberRole;
  status: SpaceMemberStatus;
  joinedAt: string;
  user: User | null;
}

export type SpaceMembersResponse = PaginatedResponse<SpaceMemberWithUser>;

// Response for fetching space team (admins + moderators, no pagination)
export interface SpaceTeamResponse {
  data: SpaceMemberWithUser[];
}
