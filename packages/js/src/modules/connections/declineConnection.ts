import { SublayHttpClient } from "../../core/client";
import { ConnectionRow } from "../../interfaces/Connection";

export interface DeclineConnectionProps {
  connectionId: string;
}

/**
 * POST /connections/:connectionId/decline — decline a request the caller
 * received. Answers with the connection row (`user` = the requester, `type`
 * `"received"`).
 */
export async function declineConnection(
  client: SublayHttpClient,
  data: DeclineConnectionProps
): Promise<ConnectionRow> {
  const { connectionId } = data;
  const response = await client.projectInstance.post<ConnectionRow>(
    `/connections/${connectionId}/decline`,
    {}
  );
  return response.data;
}
