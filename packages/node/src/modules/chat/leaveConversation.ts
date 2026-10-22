import { SublayHttpClient } from "../../core/client";

export interface LeaveConversationProps {
  conversationId: string;
  /** The user leaving. Service key required to name a user. */
  actingUserId: string;
}

export async function leaveConversation(
  client: SublayHttpClient,
  data: LeaveConversationProps
): Promise<void> {
  const { conversationId, actingUserId } = data;
  await client.projectInstance.delete(
    `/chat/conversations/${conversationId}/leave`,
    { params: { actingUserId } }
  );
}
