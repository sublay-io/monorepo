import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { User, UserIncludeParam } from "../../interfaces/User";
import { SpaceReputationUserParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface FetchUserByForeignIdProps extends SpaceReputationUserParams {
  /** Your own id for the user. Trimmed; a blank one is a 400. */
  foreignId: string;
  /**
   * Read as this user (service key only): the response is exactly what their
   * own access token would get, so a profile whose owner blocked them comes
   * back as not found. Omit it for the anonymous view.
   */
  actingUserId?: string;
  include?: UserIncludeParam;
}

/**
 * GET /users/by-foreign-id — read a user by your own id for them. A pure read:
 * a miss is 404. To fetch the user or create them when missing, use
 * {@link import("./fetchOrCreateUserByForeignId").fetchOrCreateUserByForeignId}.
 */
export async function fetchUserByForeignId(
  client: SublayHttpClient,
  data: FetchUserByForeignIdProps
): Promise<User> {
  const path = `/users/by-foreign-id`;

  const params: Record<string, any> = {
    foreignId: data.foreignId,
    actingUserId: data.actingUserId,
    include: serializeInclude(data.include),
    ...buildSpaceReputationParams({
      spaceReputation: data.spaceReputation,
      spaceReputationId: data.spaceReputationId,
      spaceReputationDescendants: data.spaceReputationDescendants,
    }),
  };

  const response = await client.projectInstance.get<User>(path, {
    params,
  });

  return response.data;
}
