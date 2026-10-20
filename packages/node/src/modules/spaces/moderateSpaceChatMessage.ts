import { SublayHttpClient } from "../../core/client";

export interface ModerateSpaceChatMessageProps {
  spaceId: string;
  messageId: string;
  moderationStatus: "removed";
  moderationReason?: string;
  /**
   * The user this request acts as. The request has exactly that user's
   * permissions in the space and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export interface ModerateSpaceChatMessageResponse {
  message: string;
  moderationStatus: string;
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
