import { SublayHttpClient } from "../../core/client";
import { AcceptedConnectionRow } from "../../interfaces/Connection";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";
import { UserSearchParams } from "../../interfaces/UserSearch";

export interface FetchConnectionsProps extends UserSearchParams {
  actingUserId: string;
  page?: number;
  limit?: number;
}

/**
 * GET /connections — the caller's accepted connections; each row's `user` is
 * the other user.
 */
export async function fetchConnections(
  client: SublayHttpClient,
  data: FetchConnectionsProps
): Promise<PaginatedResponse<AcceptedConnectionRow>> {
  const response = await client.projectInstance.get<
    PaginatedResponse<AcceptedConnectionRow>
  >("/connections", { params: data });
  return response.data;
}
