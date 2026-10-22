import { SublayHttpClient } from "../../core/client";
import { Entity, TopCommentsParams } from "../../interfaces/Entity";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface FetchEntityProps
  extends SpaceReputationContextParams,
    TopCommentsParams {
  entityId: string;
  /**
   * Read as this user (service key only): the response is exactly what their
   * own access token would get (drafts, blocks, saved flags, own reaction,
   * top comments), and the read counts as their view. Omit it for the
   * anonymous view.
   */
  actingUserId?: string;
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
