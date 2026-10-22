import { SublayHttpClient } from "../../core/client";
import { ReactionType } from "../../interfaces/Reaction";

export interface GetUserEntityReactionProps {
  entityId: string;
  actingUserId: string;
}

export interface UserReactionResponse {
  reactionType: ReactionType | null;
}

export async function getUserReaction(
  client: SublayHttpClient,
  data: GetUserEntityReactionProps
): Promise<UserReactionResponse> {
  const { entityId, actingUserId } = data;
  const response = await client.projectInstance.get<UserReactionResponse>(
    `/entities/${entityId}/reactions/me`,
    { params: { actingUserId } }
  );
  return response.data;
}
