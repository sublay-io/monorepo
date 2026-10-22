import { SublayHttpClient } from "../../core/client";

export interface CountUnreadNotificationsProps {
  actingUserId: string;
}

export async function countUnreadNotifications(
  client: SublayHttpClient,
  data: CountUnreadNotificationsProps
): Promise<number> {
  const response = await client.projectInstance.get<number>(
    "/app-notifications/count",
    { params: data }
  );
  return response.data;
}
