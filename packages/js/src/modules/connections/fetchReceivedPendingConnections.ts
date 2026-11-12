import { SublayHttpClient } from "../../core/client";
import { ConnectionRow } from "../../interfaces/Connection";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface FetchReceivedPendingConnectionsProps {
  page?: number;
  limit?: number;
}

/**
 * The caller's pending received connection requests; each row's `user` is the
 * requester and its `type` is `"received"`.
 */
export async function fetchReceivedPendingConnections(
  client: SublayHttpClient,
  data: FetchReceivedPendingConnectionsProps
): Promise<PaginatedResponse<ConnectionRow>> {
  const response =
    await client.projectInstance.get<PaginatedResponse<ConnectionRow>>(
      "/connections/pending/received",
      { params: data }
    );
  return response.data;
}
