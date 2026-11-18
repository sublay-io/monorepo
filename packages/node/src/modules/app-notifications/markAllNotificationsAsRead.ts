import { SublayHttpClient } from "../../core/client";

export interface MarkAllNotificationsAsReadProps {
  actingUserId: string;
}

export async function markAllNotificationsAsRead(
  client: SublayHttpClient,
  data: MarkAllNotificationsAsReadProps
): Promise<void> {
  await client.projectInstance.post<void>(
    "/app-notifications/mark-all-as-read",
    { actingUserId: data.actingUserId }
  );
}
