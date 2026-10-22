import { SublayHttpClient } from "../../core/client";

export interface MarkNotificationAsReadProps {
  notificationId: string;
  actingUserId: string;
}

export async function markNotificationAsRead(
  client: SublayHttpClient,
  data: MarkNotificationAsReadProps
): Promise<void> {
  const { notificationId, actingUserId } = data;
  await client.projectInstance.patch(
    `/app-notifications/${notificationId}/mark-as-read`,
    { actingUserId }
  );
}
