import { useCallback } from "react";
import {
  ChatMessage,
  ChatMessageListIncludeParam,
} from "../../../interfaces/models/ChatMessage";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { SpaceReputationContextParams } from "../../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../../utils/spaceReputationParams";

export interface MessageFilters {
  /**
   * Filter to messages that have thread replies (not quotings). `true` returns
   * only messages with at least one thread reply; `false` returns only messages
   * with none. Omit for no reply-count filtering.
   */
  hasReplies?: boolean;
}

export interface FetchManyChatMessagesProps extends SpaceReputationContextParams {
  conversationId: string;
  /** Restrict to replies of this message (thread view). */
  parentMessageId?: string | null;
  /** Keyset cursor: messages created before this. UTC ISO datetime ending in `Z` (e.g. `date.toISOString()`); an offset is rejected with a 400. Mutually exclusive with `after`. */
  before?: string | null;
  /** Keyset cursor: messages created after this. UTC ISO datetime ending in `Z` (e.g. `date.toISOString()`); an offset is rejected with a 400. Mutually exclusive with `before`. */
  after?: string | null;
  /** Page size (1–100, defaults to 50 server-side). */
  limit?: number;
  sortDir?: "asc" | "desc";
  /**
   * Opt-in fields on each message, one value or an array:
   * - `"files"` populates the `files` field.
   * - `"grants"` populates the `grants` reputation-grant summary. It costs an
   *   extra aggregate query per page, so conversations that don't render
   *   grants shouldn't ask for it. On a project without the `reputation`
   *   bundle the server still returns the summary, zero-filled, never omitted,
   *   so the field's shape doesn't depend on bundle state.
   */
  include?: ChatMessageListIncludeParam;
  filters?: MessageFilters;
}

export interface FetchManyChatMessagesResponse {
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

/**
 * Low-level, stateless fetcher for conversation messages. Returns a promise of
 * a single page — no Redux, no socket subscription. This is the single owner of
 * the messages endpoint URL and its query params; both the live store hook
 * (`useLiveChatMessages`) and the query hook (`useFetchManyChatMessagesWrapper`)
 * build on it.
 */
function useFetchManyChatMessages(): (
  props: FetchManyChatMessagesProps
) => Promise<FetchManyChatMessagesResponse> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  return useCallback(
    async (props: FetchManyChatMessagesProps) => {
      const {
        conversationId,
        parentMessageId,
        before,
        after,
        limit = 50,
        sortDir,
        include,
        filters,
        spaceReputation,
        spaceReputationId,
        spaceReputationDescendants,
      } = props;

      if (!projectId) throw new Error("No project specified");
      if (!conversationId) throw new Error("No conversation specified");

      const params: Record<string, any> = {
        limit,
        ...buildSpaceReputationParams({
          spaceReputation,
          spaceReputationId,
          spaceReputationDescendants,
        }),
      };
      if (sortDir) params.sortDir = sortDir;
      if (parentMessageId) params.parentMessageId = parentMessageId;
      if (before) params.before = before;
      if (after) params.after = after;
      const includeValue = Array.isArray(include) ? include.join(",") : include;
      if (includeValue) params.include = includeValue;
      if (filters) params.filters = filters;

      const response = await axios.get<FetchManyChatMessagesResponse>(
        `/${projectId}/chat/conversations/${conversationId}/messages`,
        { params }
      );
      return response.data;
    },
    [projectId, axios]
  );
}

export default useFetchManyChatMessages;
