import { SublayHttpClient } from "../../core/client";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface AskContentProps extends SpaceReputationContextParams {
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

export interface AskContentResponse {
  answer: string;
  sources?: { entityId: string; title: string | null }[];
}

export async function askContent(
  client: SublayHttpClient,
  data: AskContentProps
): Promise<AskContentResponse> {
  const { spaceReputation, spaceReputationId, spaceReputationDescendants, ...body } =
    data;
  const response = await client.projectInstance.post<AskContentResponse>(
    "/search/ask",
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
