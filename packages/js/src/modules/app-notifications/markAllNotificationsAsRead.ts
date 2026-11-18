import { SublayHttpClient } from "../../core/client";

export async function markAllNotificationsAsRead(
  client: SublayHttpClient
): Promise<void> {
  await client.projectInstance.post<void>(
    "/app-notifications/mark-all-as-read"
  );
}
