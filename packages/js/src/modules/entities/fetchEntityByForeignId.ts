import { SublayHttpClient } from "../../core/client";
import { Entity, TopCommentsParams } from "../../interfaces/Entity";

export interface FetchEntityByForeignIdProps extends TopCommentsParams {
  foreignId: string;
  createIfNotFound?: boolean;
  include?: string;
}

export async function fetchEntityByForeignId(
  client: SublayHttpClient,
  data: FetchEntityByForeignIdProps
): Promise<Entity> {
  const path = `/entities/by-foreign-id`;
  const response = await client.projectInstance.get<Entity>(path, {
    params: data,
  });
  return response.data;
}
