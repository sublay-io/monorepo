import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { User, UserIncludeParam } from "../../interfaces/User";
import { SpaceReputationUserParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface FetchUserByIdProps extends SpaceReputationUserParams {
  userId: string;
  include?: UserIncludeParam;
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
  const params = {
    ...rest,
    include: serializeInclude(rest.include),
    ...buildSpaceReputationParams({
      spaceReputation,
      spaceReputationId,
      spaceReputationDescendants,
    }),
  };
  const response = await client.projectInstance.get<User>(`/users/${userId}`, {
    params,
  });
  return response.data;
}
