import { SublayHttpClient } from "../../core/client";
import { BlockRow } from "../../interfaces/Block";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface FetchBlockedUsersProps {
  page?: number;
  limit?: number;
}

/**
 * GET /blocks — the token holder's own block list (their outbound blocks),
 * paginated. Each row's `user` is the blocked user. This is the private "manage / way back to unblock" surface (the
 * subject is derived from the token, no `actingUserId`).
 */
export async function fetchBlockedUsers(
  client: SublayHttpClient,
  data: FetchBlockedUsersProps = {}
): Promise<PaginatedResponse<BlockRow>> {
  const response = await client.projectInstance.get<
    PaginatedResponse<BlockRow>
  >("/blocks", { params: data });
  return response.data;
}
