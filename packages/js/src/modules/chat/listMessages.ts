import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import {
  ChatMessage,
  ChatMessageListIncludeParam,
} from "../../interfaces/ChatMessage";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface MessageFilters {
  /**
   * Filter to messages that have thread replies (not quotings). `true` returns
   * only messages with at least one thread reply; `false` returns only messages
   * with none. Omit for no reply-count filtering.
   */
  hasReplies?: boolean;
}

export interface ListMessagesProps extends SpaceReputationContextParams {
  conversationId: string;
  /**
   * List this message's thread replies (oldest first by default). Named like
   * the chat message's own `parentMessageId` field.
   */
  parentMessageId?: string;
  /** Keyset pagination: return messages created before this. UTC ISO datetime ending in `Z` (e.g. `date.toISOString()`); an offset is rejected with a 400. Mutually exclusive with `after`. */
  before?: string;
  /** Keyset pagination: return messages created after this. UTC ISO datetime ending in `Z` (e.g. `date.toISOString()`); an offset is rejected with a 400. Mutually exclusive with `before`. */
  after?: string;
  /** Page size (default 50, max 100). */
  limit?: number;
  sortDir?: "asc" | "desc";
  /**
   * Associations to populate: `"files"` (message attachments) and
   * `"grants"` (the reputation-grant summary). Pass one or an array of both.
   */
  include?: ChatMessageListIncludeParam;
  /** Optional filters, e.g. `{ hasReplies: true }`. */
  filters?: MessageFilters;
}

export interface ListMessagesResponse {
  messages: ChatMessage[];
  hasMore: boolean;
  oldestCreatedAt: string | null;
  newestCreatedAt: string | null;
  /**
   * Present only when a filter combination can't return results — e.g.
   * `hasReplies: true` together with `parentMessageId` (thread replies are one level
   * deep and never have their own replies).
   */
  notice?: string;
}

export async function listMessages(
  client: SublayHttpClient,
  data: ListMessagesProps
): Promise<ListMessagesResponse> {
  const {
    conversationId,
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
  const response = await client.projectInstance.get<ListMessagesResponse>(
    `/chat/conversations/${conversationId}/messages`,
    { params }
  );
  return response.data;
}
