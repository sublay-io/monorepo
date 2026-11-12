import { SublayHttpClient } from "../../core/client";
import { ConnectionRow } from "../../interfaces/Connection";

export interface DeclineConnectionProps {
  connectionId: string;
}

/**
 * PATCH /connections/:connectionId/decline — decline a request the caller
 * received. Answers with the connection row (`user` = the requester, `type`
 * `"received"`).
 */
export async function declineConnection(
  client: SublayHttpClient,
  data: DeclineConnectionProps
): Promise<ConnectionRow> {
  const { connectionId } = data;
  const response = await client.projectInstance.patch<ConnectionRow>(
    `/connections/${connectionId}/decline`,
    {}
  );
  return response.data;
}
