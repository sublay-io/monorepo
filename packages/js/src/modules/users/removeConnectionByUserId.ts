import { SublayHttpClient } from "../../core/client";

export interface RemoveConnectionByUserIdProps {
  /**
   * The other user in the connection (the target). The token holder is the
   * user withdrawing/declining/disconnecting.
   */
  userId: string;
}

/**
 * DELETE /users/:userId/connection — end whatever connection the caller has
 * with `:userId`. Withdrawing your own pending request or disconnecting an
 * accepted connection deletes it; removing a request `:userId` sent you
 * declines it. Answers 204 with no body in every case.
 */
export async function removeConnectionByUserId(
  client: SublayHttpClient,
  data: RemoveConnectionByUserIdProps
): Promise<void> {
  const { userId } = data;
  await client.projectInstance.delete(`/users/${userId}/connection`);
}
