import { SublayHttpClient } from "../../core/client";

export interface GetUnreadCountProps {
  /** The user to act as. Service key required to name a user. */
  actingUserId: string;
}

export interface UnreadCountResponse {
  totalUnread: number;
  unreadConversationCount: number;
}

export async function getUnreadCount(
  client: SublayHttpClient,
  data: GetUnreadCountProps
): Promise<UnreadCountResponse> {
  const { actingUserId } = data;
  const response = await client.projectInstance.get<UnreadCountResponse>(
    "/chat/conversations/unread-count",
    { params: { actingUserId } }
  );
  return response.data;
}
