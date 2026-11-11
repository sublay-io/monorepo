import { SublayHttpClient } from "../../core/client";
import { ConnectionRow } from "../../interfaces/Connection";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface FetchSentPendingConnectionsProps {
  actingUserId: string;
  page?: number;
  limit?: number;
}

/**
 * The caller's pending sent connection requests; each row's `user` is the
 * receiver and its `type` is `"sent"`.
 */
export async function fetchSentPendingConnections(
  client: SublayHttpClient,
  data: FetchSentPendingConnectionsProps
): Promise<PaginatedResponse<ConnectionRow>> {
  const response =
    await client.projectInstance.get<PaginatedResponse<ConnectionRow>>(
      "/connections/pending/sent",
      { params: data }
    );
  return response.data;
}
