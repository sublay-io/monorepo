import { SublayHttpClient } from "../../core/client";

export interface MarkAllNotificationsAsReadProps {
  actingUserId: string;
}

export interface MarkAllNotificationsAsReadResponse {
  markedAsRead: number;
}

export async function markAllNotificationsAsRead(
  client: SublayHttpClient,
  data: MarkAllNotificationsAsReadProps
): Promise<MarkAllNotificationsAsReadResponse> {
  const response =
    await client.projectInstance.patch<MarkAllNotificationsAsReadResponse>(
      "/app-notifications/mark-all-as-read",
      { actingUserId: data.actingUserId }
    );
  return response.data;
}
