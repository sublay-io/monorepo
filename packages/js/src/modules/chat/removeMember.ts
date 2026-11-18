import { SublayHttpClient } from "../../core/client";

export interface RemoveMemberProps {
  conversationId: string;
  /** The member to remove (the target). */
  userId: string;
}

export async function removeMember(
  client: SublayHttpClient,
  data: RemoveMemberProps
): Promise<void> {
  const { conversationId, userId } = data;
  await client.projectInstance.delete<void>(
    `/chat/conversations/${conversationId}/members/${userId}`
  );
}
