import { SublayHttpClient } from "../../core/client";
import { Entity } from "../../interfaces/Entity";
import { Comment } from "../../interfaces/Comment";
import { ChatMessage } from "../../interfaces/ChatMessage";
import { User } from "../../interfaces/User";
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
}

/**
 * A chat message as content search returns it: the stored message and its
 * sender, without the reactions, files, grants and quoted message the chat
 * reads attach.
 */
export type ContentSearchChatMessage = Omit<
  ChatMessage,
  "user" | "quotedMessage" | "reactionCounts" | "userReactions" | "files" | "grants"
> & {
  user: User | null; // null when the sender's account has been deleted
};

/** One search hit, most similar first. `record`'s type follows `sourceType`. */
export type ContentSearchResult =
  | { sourceType: "entity"; similarity: number; record: Entity }
  | { sourceType: "comment"; similarity: number; record: Comment }
  | { sourceType: "message"; similarity: number; record: ContentSearchChatMessage };

export async function searchContent(
  client: SublayHttpClient,
  data: SearchContentProps
): Promise<ContentSearchResult[]> {
  // Every field goes in the body on a POST, the space-reputation options too
  // (flattened via the helper so the `spaceReputation` object never reaches
  // the server nested).
  const {
    spaceReputation,
    ...body
  } = data;
  const response = await client.projectInstance.post<ContentSearchResult[]>(
    "/search/content",
    {
      ...body,
      ...buildSpaceReputationParams({ spaceReputation }),
    }
  );
  return response.data;
}
