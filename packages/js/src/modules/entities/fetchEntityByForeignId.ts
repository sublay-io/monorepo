import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import {
  Entity,
  TopCommentsParams,
  EntityIncludeParam,
} from "../../interfaces/Entity";

export interface FetchEntityByForeignIdProps extends TopCommentsParams {
  foreignId: string;
  createIfNotFound?: boolean;
  include?: EntityIncludeParam;
}

export async function fetchEntityByForeignId(
  client: SublayHttpClient,
  data: FetchEntityByForeignIdProps
): Promise<Entity> {
  const path = `/entities/by-foreign-id`;
  const response = await client.projectInstance.get<Entity>(path, {
    params: { ...data, include: serializeInclude(data.include) },
  });
  return response.data;
}
