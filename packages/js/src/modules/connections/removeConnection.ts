import { SublayHttpClient } from "../../core/client";

export interface RemoveConnectionProps {
  connectionId: string;
}

/**
 * DELETE /connections/:connectionId — withdraw a pending request or remove an
 * accepted connection. Answers 204 with no body.
 */
export async function removeConnection(
  client: SublayHttpClient,
  data: RemoveConnectionProps
): Promise<void> {
  const { connectionId } = data;
  await client.projectInstance.delete(`/connections/${connectionId}`);
}
