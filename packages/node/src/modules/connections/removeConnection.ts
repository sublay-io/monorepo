import { SublayHttpClient } from "../../core/client";

export interface RemoveConnectionProps {
  connectionId: string;
  actingUserId: string;
}

export async function removeConnection(
  client: SublayHttpClient,
  data: RemoveConnectionProps
): Promise<void> {
  const { connectionId, actingUserId } = data;
  await client.projectInstance.delete(`/connections/${connectionId}`, {
    params: { actingUserId },
  });
}
