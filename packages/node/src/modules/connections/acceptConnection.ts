import { SublayHttpClient } from "../../core/client";
import { ConnectionActionResponse } from "../../interfaces/Connection";

export interface AcceptConnectionProps {
  connectionId: string;
  actingUserId: string;
}

export async function acceptConnection(
  client: SublayHttpClient,
  data: AcceptConnectionProps
): Promise<ConnectionActionResponse> {
  const { connectionId, actingUserId } = data;
  const response = await client.projectInstance.patch<ConnectionActionResponse>(
    `/connections/${connectionId}/accept`,
    { actingUserId }
  );
  return response.data;
}
