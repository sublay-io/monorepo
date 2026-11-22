import { SublayHttpClient } from "../../core/client";
import { SentChatMessage } from "../../interfaces/ChatMessage";
import { GifData } from "../../interfaces/Comment";
import { Mention } from "../../interfaces/Mention";

export interface EditMessageProps {
  conversationId: string;
  messageId: string;
  content?: string;
  /** A GIF attachment, or null to clear it. */
  gif?: GifData | null;
  mentions?: Mention[];
  metadata?: Record<string, any> | null;
}

export async function editMessage(
  client: SublayHttpClient,
  data: EditMessageProps
): Promise<SentChatMessage> {
  const { conversationId, messageId, ...body } = data;
  const response = await client.projectInstance.patch<SentChatMessage>(
    `/chat/conversations/${conversationId}/messages/${messageId}`,
    body
  );
  return response.data;
}
