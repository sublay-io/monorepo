import { SublayHttpClient } from "../../core/client";

export interface MarkAsReadProps {
  conversationId: string;
  /** The message up to which the conversation is marked read (uuid, required). */
  messageId: string;
}

export async function markAsRead(
  client: SublayHttpClient,
  data: MarkAsReadProps
): Promise<void> {
  const { conversationId, messageId } = data;
  await client.projectInstance.post<void>(
    `/chat/conversations/${conversationId}/read`,
    { messageId }
  );
}
