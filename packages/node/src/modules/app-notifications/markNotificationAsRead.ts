import { SublayHttpClient } from "../../core/client";

export interface MarkNotificationAsReadProps {
  notificationId: string;
  actingUserId: string;
}

/** POST /app-notifications/:notificationId/mark-as-read — answers 204, no body. */
export async function markNotificationAsRead(
  client: SublayHttpClient,
  data: MarkNotificationAsReadProps
): Promise<void> {
  const { notificationId, actingUserId } = data;
  await client.projectInstance.post(
    `/app-notifications/${notificationId}/mark-as-read`,
    { actingUserId }
  );
}
