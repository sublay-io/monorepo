import { SublayHttpClient } from "../../core/client";
import { Entity } from "../../interfaces/Entity";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface SearchContentProps extends SpaceReputationContextParams {
  query: string;
  sourceTypes?: ("entity" | "comment" | "message")[];
  spaceId?: string;
  /**
   * With a `spaceId`, also search every space nested under it (children,
   * grandchildren — the whole subtree, any depth). Ignored without a `spaceId`.
   * Defaults to false (exact-space search).
   */
  includeChildSpaces?: boolean;
  conversationId?: string;
  limit?: number;
  /**
   * The user to search as: the result is exactly what their own access token
   * would get (their chats, their blocks, the moderation details they may
   * see). Without it, the anonymous view: no chat messages, no block
   * filtering, no comment moderation details.
   */
  actingUserId?: string;
}

export async function searchContent(
  client: SublayHttpClient,
  data: SearchContentProps
): Promise<PaginatedResponse<Entity>> {
  const { spaceReputation, spaceReputationId, spaceReputationDescendants, ...body } =
    data;
  // Every field goes in the body on a POST, the space-reputation options too.
  const response = await client.projectInstance.post<PaginatedResponse<Entity>>("/search/content", {
    ...body,
    ...buildSpaceReputationParams({
      spaceReputation,
      spaceReputationId,
      spaceReputationDescendants,
    }),
  });
  return response.data;
}
