import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChatMessage,
  ChatMessageListIncludeParam,
} from "../../../interfaces/models/ChatMessage";
import { handleError } from "../../../utils/handleError";
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
  hasMore: boolean;
  loadMore: () => void;
  /** Re-fetch the first page from scratch (e.g. to pick up new matches). */
  refetch: () => void;
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

  // Forwarded to the leaf fetcher, which flattens it via
  // buildSpaceReputationParams before it reaches the serializer.
  const reputation = { spaceReputation };
  const reputationKey = JSON.stringify(reputation);

  const fetchMany = useFetchManyChatMessages();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // Cursor for the next page: the id of the last message loaded, which is the
  // furthest one in the direction of travel (the oldest for "desc", the newest
  // for "asc").
  const cursorRef = useRef<string | null>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  // Stable primitive for dependency arrays — `filters` is a fresh object each
  // render unless the caller memoizes it.
  const filtersKey = JSON.stringify(filters ?? {});
  const includeKey = Array.isArray(include) ? include.join(",") : include ?? "";

  const advanceCursor = (page: ChatMessage[]) => {
    const last = page[page.length - 1];
    if (last) cursorRef.current = last.id;
  };

  const refetch = useCallback(async () => {
    if (!conversationId) return;
    loadingRef.current = true;
    setLoading(true);
    hasMoreRef.current = true;
    setHasMore(true);
    try {
      const res = await fetchMany({
        conversationId,
        parentMessageId,
        limit,
        sortDir,
        include,
        filters,
        ...reputation,
      });
      cursorRef.current = null;
      setMessages(res.data);
      hasMoreRef.current = res.pagination.hasMore;
      setHasMore(res.pagination.hasMore);
      advanceCursor(res.data);
    } catch (err) {
      handleError(err, "Failed to fetch messages");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMany, conversationId, parentMessageId, limit, sortDir, includeKey, filtersKey, reputationKey]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current || !cursorRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetchMany({
        conversationId,
        parentMessageId,
        limit,
        sortDir,
        include,
        filters,
        ...reputation,
        ...(sortDir === "asc"
          ? { after: cursorRef.current }
          : { before: cursorRef.current }),
      });
      setMessages((prev) => [...prev, ...res.data]);
      hasMoreRef.current = res.pagination.hasMore;
      setHasMore(res.pagination.hasMore);
      advanceCursor(res.data);
    } catch (err) {
      handleError(err, "Failed to load more messages");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMany, conversationId, parentMessageId, limit, sortDir, includeKey, filtersKey, reputationKey]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { messages, loading, hasMore, loadMore, refetch };
}

export default useFetchManyChatMessagesWrapper;
