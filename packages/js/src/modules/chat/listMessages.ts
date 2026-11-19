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
  /**
   * A message id: return the `limit` messages just before this message.
   * Continue an older page from the oldest message you hold. It must be a
   * message of this conversation at the same thread level (`parentMessageId`),
   * or the server answers `400 chat/invalid-cursor`. Mutually exclusive with
   * `after`.
   */
  before?: string;
  /**
   * A message id: return the `limit` messages just after this message.
   * Continue a newer page from the newest message you hold. Same rules as
   * `before`. Mutually exclusive with `before`.
   */
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
  /** The page, ordered by `sortDir`. */
  data: ChatMessage[];
  pagination: {
    /**
     * More messages exist beyond this page in the direction of travel: older
     * with `before`, newer with `after`; with no anchor, older for `desc` and
     * newer for `asc`.
     */
    hasMore: boolean;
  };
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
    ...rest
  } = data;
  const params = {
    ...rest,
    include: serializeInclude(rest.include),
    ...buildSpaceReputationParams({ spaceReputation }),
  };
  const response = await client.projectInstance.get<ListMessagesResponse>(
    `/chat/conversations/${conversationId}/messages`,
    { params }
  );
  return response.data;
}
