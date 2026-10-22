import { SublayHttpClient } from "../../core/client";
import { ConnectionCountResponse } from "../../interfaces/Connection";

export interface FetchConnectionsCountByUserIdProps {
  userId: string;
  /**
   * Read as this user (service key only): the response is exactly what their
   * own access token would get, with their block rules applied. Omit it for
   * the anonymous view.
   */
  actingUserId?: string;
}

export async function fetchConnectionsCountByUserId(
  client: SublayHttpClient,
  data: FetchConnectionsCountByUserIdProps
): Promise<ConnectionCountResponse> {
  const { userId, ...params } = data;
  const response = await client.projectInstance.get<ConnectionCountResponse>(
    `/users/${userId}/connections-count`,
    { params }
  );
  return response.data;
}
