import {
  ChatMessage,
  ChatMessageListIncludeParam,
} from "../../../interfaces/models/ChatMessage";
import { useListEngine } from "../../list/useListEngine";
import useFetchManyChatMessages, {
  MessageFilters,
} from "./useFetchManyChatMessages";
import { SpaceReputationContextParams } from "../../../interfaces/SpaceReputation";

export interface UseFetchManyChatMessagesWrapperProps extends SpaceReputationContextParams {
  conversationId: string;
  /** Restrict to replies of this message (thread view). */
  parentMessageId?: string | null;
  /** Page size. Defaults to `50`. */
  limit?: number;
  /**
   * Sort direction by creation time. Defaults to `"desc"` (newest first);
   * `loadMore` then fetches older messages. With `"asc"`, `loadMore` fetches
   * newer messages.
   */
  sortDir?: "asc" | "desc";
  /**
   * Opt-in fields on each message, one value or an array: `"files"` populates
   * `files`, `"grants"` the `grants` reputation-grant summary.
   */
  include?: ChatMessageListIncludeParam;
  filters?: MessageFilters;
}

export interface UseFetchManyChatMessagesWrapperValues {
  messages: ChatMessage[];
  loading: boolean;
  /** The last load failure. Cleared when the next load starts; `loadMore()` retries it. */
  error: Error | null;
  /** Whether `loadMore()` has anything to fetch: a next page, or a load that failed. */
  hasMore: boolean;
  /**
   * Load the next page in the list's order (older messages with `"desc"`,
   * newer with `"asc"`), or retry the load that failed. Does nothing while
   * loading or when there is nothing more. Never rejects.
   */
  loadMore: () => Promise<void>;
  /** Reload the first page (e.g. to pick up new matches). Never rejects. */
  refetch: () => Promise<void>;
}

/**
 * Batteries-included, self-contained list of conversation messages with
 * cursor pagination — keeps results in local component state, NOT Redux, and
 * does NOT subscribe to socket updates. Use this for read-only / filtered
 * queries (e.g. "messages that have replies"). For the live canonical
 * conversation stream, use `useLiveChatMessages` instead.
 */
function useFetchManyChatMessagesWrapper(
  props: UseFetchManyChatMessagesWrapperProps
): UseFetchManyChatMessagesWrapperValues {
  const {
    conversationId,
    parentMessageId,
    limit = 50,
    sortDir = "desc",
    include,
    filters,
    spaceReputation,
  } = props;

  const fetchMany = useFetchManyChatMessages();

  // The one request builder for every page. The cursor is the id of the last
  // message loaded, the furthest one in the direction of travel (the oldest
  // for "desc", the newest for "asc").
  const buildParams = (cursor: string | null) => ({
    conversationId,
    parentMessageId,
    limit,
    sortDir,
    include,
    filters,
    spaceReputation,
    ...(cursor === null
      ? {}
      : sortDir === "asc"
        ? { after: cursor }
        : { before: cursor }),
  });

  const list = useListEngine<ChatMessage, string>({
    enabled: !!conversationId,
    // Serialized, so an inline `filters` object or `include` array (a fresh
    // reference every render) doesn't restart the list.
    resetKey: JSON.stringify(buildParams(null)),
    fetchPage: async (cursor) => {
      const res = await fetchMany(buildParams(cursor));
      const last = res.data[res.data.length - 1];
      return {
        items: res.data,
        hasMore: res.pagination.hasMore,
        // An empty page leaves the cursor where it was.
        nextCursor: last ? last.id : cursor,
      };
    },
    errorLabel: "Failed to fetch messages:",
  });

  return {
    messages: list.items,
    loading: list.loading,
    error: list.error,
    hasMore: list.hasMore,
    loadMore: list.loadMore,
    refetch: list.refetch,
  };
}

export default useFetchManyChatMessagesWrapper;
