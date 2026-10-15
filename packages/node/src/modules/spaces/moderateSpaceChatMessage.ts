import { SublayHttpClient } from "../../core/client";

export interface ModerateSpaceChatMessageProps {
  spaceId: string;
  messageId: string;
  moderationStatus: "removed";
  moderationReason?: string;
  /**
   * The moderator the key acts for: the request then has exactly that
   * moderator's permissions in the space. Omit it to act as the project.
   */
  actingUserId?: string;
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
