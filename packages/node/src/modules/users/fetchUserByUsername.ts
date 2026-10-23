import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { User, UserIncludeParam } from "../../interfaces/User";
import { SpaceReputationUserParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface FetchUserByUsernameProps extends SpaceReputationUserParams {
  username: string;
  /**
   * Read as this user (service key only): the response is exactly what their
   * own access token would get, with their block rules applied. Omit it for
   * the anonymous view.
   */
  actingUserId?: string;
  include?: UserIncludeParam;
}

export async function fetchUserByUsername(
  client: SublayHttpClient,
  data: FetchUserByUsernameProps
): Promise<User> {
  const { spaceReputation, spaceReputationId, spaceReputationDescendants, ...rest } =
    data;
  const response = await client.projectInstance.get<User>("/users/by-username", {
    params: {
      ...rest,
      include: serializeInclude(rest.include),
      ...buildSpaceReputationParams({
        spaceReputation,
        spaceReputationId,
        spaceReputationDescendants,
      }),
    },
  });
  return response.data;
}
