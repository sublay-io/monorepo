import { SublayHttpClient } from "../../core/client";
import { EntityRecord } from "../../interfaces/Entity";

export interface IncrementEntityViewsProps {
  entityId: string;
  count?: number;
}

export async function incrementEntityViews(
  client: SublayHttpClient,
  data: IncrementEntityViewsProps
): Promise<EntityRecord> {
  const { entityId, ...body } = data;
  const path = `/entities/${entityId}/increment-views`;
  // `count` is a JSON integer in the body (default 1 when omitted). The server
  // returns the stored entity record only (no computed or included fields).
  const response = await client.projectInstance.post<EntityRecord>(path, body);
  return response.data;
}
