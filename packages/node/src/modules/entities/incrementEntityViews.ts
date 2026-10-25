import { SublayHttpClient } from "../../core/client";
import { Entity } from "../../interfaces/Entity";

export interface IncrementEntityViewsProps {
  entityId: string;
  count?: number;
}

export async function incrementEntityViews(
  client: SublayHttpClient,
  data: IncrementEntityViewsProps
): Promise<Entity> {
  const { entityId, ...body } = data;
  const path = `/entities/${entityId}/increment-views`;
  // `count` is a JSON integer in the body (default 1 when omitted).
  const response = await client.projectInstance.patch<Entity>(path, body);
  return response.data;
}
