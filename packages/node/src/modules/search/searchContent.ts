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
   * The user to search as: results follow that user's access (their chats,
   * their blocks). Without it, no chat messages are returned.
   */
  actingUserId?: string;
}

export async function searchContent(
  client: SublayHttpClient,
  data: SearchContentProps
): Promise<PaginatedResponse<Entity>> {
  const { spaceReputation, spaceReputationId, spaceReputationDescendants, ...body } =
    data;
  const response = await client.projectInstance.post<PaginatedResponse<Entity>>(
    "/search/content",
    body,
    {
      params: buildSpaceReputationParams({
        spaceReputation,
        spaceReputationId,
        spaceReputationDescendants,
      }),
    }
  );
  return response.data;
}
