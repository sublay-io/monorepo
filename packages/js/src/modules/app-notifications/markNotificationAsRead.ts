import { SublayHttpClient } from "../../core/client";

export interface MarkNotificationAsReadProps {
  notificationId: string;
}

/** PATCH /app-notifications/:notificationId/mark-as-read — answers 204, no body. */
export async function markNotificationAsRead(
  client: SublayHttpClient,
  data: MarkNotificationAsReadProps
): Promise<void> {
  const { notificationId } = data;
  await client.projectInstance.patch(
    `/app-notifications/${notificationId}/mark-as-read`
  );
}
