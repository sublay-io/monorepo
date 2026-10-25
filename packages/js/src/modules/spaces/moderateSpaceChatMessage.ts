import { SublayHttpClient } from "../../core/client";

export interface ModerateSpaceChatMessageProps {
  spaceId: string;
  messageId: string;
  /** Chat messages are never held for approval, so `"remove"` is the only action. */
  action: "remove";
  /** Why the message was removed. Trimmed; at most 1000 characters. */
  reason?: string;
}

export interface ModerateSpaceChatMessageResponse {
  message: string;
  moderationStatus: "removed";
}

export async function moderateSpaceChatMessage(
  client: SublayHttpClient,
  data: ModerateSpaceChatMessageProps
): Promise<ModerateSpaceChatMessageResponse> {
  const { spaceId, messageId, ...body } = data;
  const response = await client.projectInstance.patch<ModerateSpaceChatMessageResponse>(
    `/spaces/${spaceId}/chat/messages/${messageId}/moderation`,
    body
  );
  return response.data;
}
