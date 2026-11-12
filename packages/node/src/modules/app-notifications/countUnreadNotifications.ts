import { SublayHttpClient } from "../../core/client";

export interface CountUnreadNotificationsResponse {
  count: number;
}

export interface CountUnreadNotificationsProps {
  actingUserId: string;
}

/** GET /app-notifications/unread-count — `{ count }` of unread notifications. */
export async function countUnreadNotifications(
  client: SublayHttpClient,
  data: CountUnreadNotificationsProps
): Promise<CountUnreadNotificationsResponse> {
  const response = await client.projectInstance.get<CountUnreadNotificationsResponse>(
    "/app-notifications/unread-count",
    { params: data }
  );
  return response.data;
}
