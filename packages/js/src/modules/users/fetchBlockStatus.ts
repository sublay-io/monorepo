import { SublayHttpClient } from "../../core/client";
import { BlockStatus } from "../../interfaces/Block";

export interface FetchBlockStatusProps {
  /**
   * The user whose block status is being checked (the target). The status is the
   * token holder's OUTBOUND state only: do *I* block `:userId`?
   */
  userId: string;
}

/**
 * GET /users/:userId/block — the token holder's outbound block status toward
 * `:userId` (derived from the token, no `actingUserId`): `{ isBlocking }`,
 * plus the block row (`user` = `:userId`) when they block them. It never
 * says whether `:userId` blocks the caller.
 */
export async function fetchBlockStatus(
  client: SublayHttpClient,
  data: FetchBlockStatusProps
): Promise<BlockStatus> {
  const { userId } = data;
  const response = await client.projectInstance.get<BlockStatus>(
    `/users/${userId}/block`
  );
  return response.data;
}
