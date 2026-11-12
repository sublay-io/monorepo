import { SublayHttpClient } from "../../core/client";
import { ConnectionRow } from "../../interfaces/Connection";

export interface AcceptConnectionProps {
  connectionId: string;
}

/**
 * POST /connections/:connectionId/accept — accept a request the caller
 * received. Answers with the connection row (`user` = the requester, `type`
 * `"received"`).
 */
export async function acceptConnection(
  client: SublayHttpClient,
  data: AcceptConnectionProps
): Promise<ConnectionRow> {
  const { connectionId } = data;
  const response = await client.projectInstance.post<ConnectionRow>(
    `/connections/${connectionId}/accept`,
    {}
  );
  return response.data;
}
