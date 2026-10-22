import { SublayHttpClient } from "../../core/client";
import { BlockedUser } from "../../interfaces/Block";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface FetchBlockedUsersProps {
  /** The user the service key acts as: the blocker whose own block list is read. */
  actingUserId: string;
  page?: number;
  limit?: number;
}

export async function fetchBlockedUsers(
  client: SublayHttpClient,
  data: FetchBlockedUsersProps
): Promise<PaginatedResponse<BlockedUser>> {
  const response = await client.projectInstance.get<
    PaginatedResponse<BlockedUser>
  >(`/blocks`, {
    params: data,
  });
  return response.data;
}
