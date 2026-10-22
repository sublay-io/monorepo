import { SublayHttpClient } from "../../core/client";
import { User } from "../../interfaces/User";
import { SpaceReputationUserParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface FetchUserSuggestionsProps extends SpaceReputationUserParams {
  query: string;
  /**
   * Read as this user (service key only): the response is exactly what their
   * own access token would get, with their block rules applied. Omit it for
   * the anonymous view.
   */
  actingUserId?: string;
}

export async function fetchUserSuggestions(
  client: SublayHttpClient,
  data: FetchUserSuggestionsProps
): Promise<User[]> {
  const { spaceReputation, spaceReputationId, spaceReputationDescendants, ...rest } =
    data;
  const response = await client.projectInstance.get<User[]>(
    "/users/suggestions",
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
