import { SublayHttpClient } from "../../core/client";
import { ConnectionStatus } from "../../interfaces/Connection";

export interface FetchConnectionStatusProps {
  /** The other user in the connection (the target). */
  userId: string;
  /** The user whose perspective the status is from. */
  actingUserId: string;
}

/**
 * GET /users/:userId/connection — `{ isConnected }` (true once accepted), plus
 * the connection row whenever one exists between the two users, pending and
 * declined included.
 */
export async function fetchConnectionStatus(
  client: SublayHttpClient,
  data: FetchConnectionStatusProps
): Promise<ConnectionStatus> {
  const { userId, actingUserId } = data;
  const response =
    await client.projectInstance.get<ConnectionStatus>(
      `/users/${userId}/connection`,
      { params: { actingUserId } }
    );
  return response.data;
}
