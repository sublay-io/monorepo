import { SublayHttpClient } from "../../core/client";
import { Entity, TopCommentsParams } from "../../interfaces/Entity";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface FetchEntityProps
  extends SpaceReputationContextParams,
    TopCommentsParams {
  entityId: string;
  include?: string;
}

export async function fetchEntity(
  client: SublayHttpClient,
  data: FetchEntityProps
): Promise<Entity> {
  const {
    entityId,
    spaceReputation,
    spaceReputationId,
    spaceReputationDescendants,
    ...rest
  } = data;
  const response = await client.projectInstance.get<Entity>(
    `/entities/${entityId}`,
    {
      params: {
        ...rest,
        ...buildSpaceReputationParams({
          spaceReputation,
          spaceReputationId,
          spaceReputationDescendants,
        }),
      },
    }
  );
  return response.data;
}
