import { useCallback } from "react";
import {
  ChatMessage,
  ChatMessageListIncludeParam,
} from "../../../interfaces/models/ChatMessage";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { SpaceReputationContextParams } from "../../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../../utils/spaceReputationParams";
import { toSublayError } from "../../../errors/SublayError";
import { SublayError } from "../../../errors/SublayError";

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
  /**
   * A message id: the `limit` messages just before this message. Continue an
   * older page from the oldest message you hold. It must be a message of this
   * conversation at the same thread level (`parentMessageId`), or the server
   * answers `400 chat/invalid-cursor`. Mutually exclusive with `after`.
   */
  before?: string | null;
  /**
   * A message id: the `limit` messages just after this message. Continue a
   * newer page from the newest message you hold. Same rules as `before`.
   * Mutually exclusive with `before`.
   */
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

/**
 * Whether a messages request failed because its `before` / `after` anchor is
 * not a message the server can page from (`chat/invalid-cursor`).
 */
export function isInvalidChatCursorError(err: unknown): boolean {
  return toSublayError(err).code === "chat/invalid-cursor";
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
      } = props;

      if (!projectId) throw new SublayError("No project specified");
      if (!conversationId) throw new SublayError("No conversation specified");

      const params: Record<string, any> = {
        limit,
        ...buildSpaceReputationParams({ spaceReputation }),
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
