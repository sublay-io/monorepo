import { SublayHttpClient } from "../../core/client";
import { BlockRow } from "../../interfaces/Block";

export interface CreateBlockProps {
  /** The user being blocked (the target). The blocker is the token holder. */
  userId: string;
}

/**
 * POST /users/:userId/block — block `:userId`.
 *
 * The blocker is derived from the token (no `actingUserId`). Idempotent:
 * re-blocking an already-blocked user succeeds (200; a new block is 201), and
 * both answer with the block row, whose `user` is the blocked user. Self-block
 * is rejected server-side. On a new block the server tears down existing
 * follows/connections both ways.
 */
export async function createBlock(
  client: SublayHttpClient,
  data: CreateBlockProps
): Promise<BlockRow> {
  const { userId } = data;
  const response = await client.projectInstance.post<BlockRow>(
    `/users/${userId}/block`,
    {}
  );
  return response.data;
}
