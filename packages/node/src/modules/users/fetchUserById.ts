import { SublayHttpClient } from "../../core/client";
import { User } from "../../interfaces/User";
import { SpaceReputationUserParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface FetchUserByIdProps extends SpaceReputationUserParams {
  userId: string;
  /**
   * Read as this user (service key only): the response is exactly what their
   * own access token would get, with their block rules applied. Omit it for
   * the anonymous view.
   */
  actingUserId?: string;
  include?: string;
}

export async function fetchUserById(
  client: SublayHttpClient,
  data: FetchUserByIdProps
): Promise<User> {
  const {
    userId,
    spaceReputation,
    spaceReputationId,
    spaceReputationDescendants,
    ...rest
  } = data;
  const path = `/users/${userId}`; // assuming client handles prefix like /{projectId}
  const response = await client.projectInstance.get<User>(path, {
    params: {
      ...rest,
      ...buildSpaceReputationParams({
        spaceReputation,
        spaceReputationId,
        spaceReputationDescendants,
      }),
    },
  });
  return response.data;
}
