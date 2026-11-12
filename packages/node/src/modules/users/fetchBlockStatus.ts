import { SublayHttpClient } from "../../core/client";
import { BlockStatus } from "../../interfaces/Block";

export interface FetchBlockStatusProps {
  /** The user whose block relationship is being checked (the target). */
  userId: string;
  /** The user whose perspective the status is from (the blocker). */
  actingUserId: string;
}

/**
 * GET /users/:userId/block — `{ isBlocking }`, plus the block row (`user` =
 * `:userId`) when the acting user blocks them. Outbound only.
 */
export async function fetchBlockStatus(
  client: SublayHttpClient,
  data: FetchBlockStatusProps
): Promise<BlockStatus> {
  const { userId, actingUserId } = data;
  const response = await client.projectInstance.get<BlockStatus>(
    `/users/${userId}/block`,
    { params: { actingUserId } }
  );
  return response.data;
}
