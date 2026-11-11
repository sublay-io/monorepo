import { SublayHttpClient } from "../../core/client";
import { BlockRow } from "../../interfaces/Block";

export interface CreateBlockProps {
  /** The user being blocked (the target). */
  userId: string;
  /** The user performing the block (the blocker). */
  actingUserId: string;
}

/**
 * POST /users/:userId/block — block `:userId`. Answers 201 for a new block
 * and 200 for a re-block (idempotent), both with the block row (`user` = the
 * blocked user).
 */
export async function createBlock(
  client: SublayHttpClient,
  data: CreateBlockProps
): Promise<BlockRow> {
  const { userId, actingUserId } = data;
  const response = await client.projectInstance.post<BlockRow>(
    `/users/${userId}/block`,
    { actingUserId }
  );
  return response.data;
}
