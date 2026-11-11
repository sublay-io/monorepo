import { SublayHttpClient } from "../../core/client";
import { BlockRow } from "../../interfaces/Block";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface FetchBlockedUsersProps {
  /** The user the service key acts as: the blocker whose own block list is read. */
  actingUserId: string;
  page?: number;
  limit?: number;
}

/** GET /blocks — the acting user's own block list; each row's `user` is the blocked user. */
export async function fetchBlockedUsers(
  client: SublayHttpClient,
  data: FetchBlockedUsersProps
): Promise<PaginatedResponse<BlockRow>> {
  const response = await client.projectInstance.get<
    PaginatedResponse<BlockRow>
  >(`/blocks`, {
    params: data,
  });
  return response.data;
}
