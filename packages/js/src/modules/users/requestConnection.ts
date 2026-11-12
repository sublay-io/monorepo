import { SublayHttpClient } from "../../core/client";
import { ConnectionRow } from "../../interfaces/Connection";

export interface RequestConnectionProps {
  /**
   * The user the connection is requested with (the target). The requester is
   * the token holder.
   */
  userId: string;
  message?: string;
}

/**
 * POST /users/:userId/connection — request a connection with `:userId`.
 * Answers 201 with the pending connection row (`user` = `:userId`, `type`
 * `"sent"`).
 */
export async function requestConnection(
  client: SublayHttpClient,
  data: RequestConnectionProps
): Promise<ConnectionRow> {
  const { userId, ...body } = data;
  const response =
    await client.projectInstance.post<ConnectionRow>(
      `/users/${userId}/connection`,
      body
    );
  return response.data;
}
