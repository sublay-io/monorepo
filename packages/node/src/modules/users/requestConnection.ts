import { SublayHttpClient } from "../../core/client";
import { ConnectionRow } from "../../interfaces/Connection";

export interface RequestConnectionProps {
  /** The user the connection is requested with (the target). */
  userId: string;
  /** The user sending the request (the requester). */
  actingUserId: string;
  message?: string;
}

/**
 * POST /users/:userId/connection — request a connection with `:userId`.
 * Answers 201 with the new pending connection row (`user` = `:userId`, `type`
 * `"sent"`). Repeating a request that is still pending, or requesting a user
 * you're already connected with, answers 200 with the existing row (the stored
 * message is kept). A request `:userId` already sent you is a 409
 * `connection/request-received` whose body carries that row as `connection`,
 * so it can be accepted instead; after `:userId` declined your request it is a
 * 409 `connection/request-declined`.
 */
export async function requestConnection(
  client: SublayHttpClient,
  data: RequestConnectionProps
): Promise<ConnectionRow> {
  const { userId, ...body } = data;
  const response = await client.projectInstance.post<ConnectionRow>(
    `/users/${userId}/connection`,
    body
  );
  return response.data;
}
