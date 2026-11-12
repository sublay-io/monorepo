import { SublayHttpClient } from "../../core/client";

export interface CountUnreadNotificationsResponse {
  count: number;
}

/** GET /app-notifications/unread-count — `{ count }` of unread notifications. */
export async function countUnreadNotifications(
  client: SublayHttpClient
): Promise<CountUnreadNotificationsResponse> {
  const response = await client.projectInstance.get<CountUnreadNotificationsResponse>(
    "/app-notifications/unread-count"
  );
  return response.data;
}
