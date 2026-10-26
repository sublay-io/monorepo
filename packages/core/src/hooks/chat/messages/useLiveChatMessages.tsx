import { useCallback, useEffect, useRef } from "react";
import { useSublayDispatch, useSublaySelector } from "../../../store/hooks";
import {
  selectMessages,
  selectMessagesLoading,
  selectMessagesHasMore,
  selectThreadReplies,
  selectThreadLoading,
  selectThreadHasMore,
  selectThreadCursor,
  upsertMessage,
  setMessagesLoading,
  setMessagesHasMore,
  mergeThreadReplies,
  startThreadLoad,
  setThreadLoading,
} from "../../../store/slices/chatSlice";
import { ChatMessage } from "../../../interfaces/models/ChatMessage";
import useProject from "../../projects/useProject";
import { handleError } from "../../../utils/handleError";
import { useChatContext } from "../../../context/chat-context";
import useFetchManyChatMessages from "./useFetchManyChatMessages";

export interface UseLiveChatMessagesProps {
  conversationId: string;
  parentMessageId?: string | null;
  limit?: number;
  includeFiles?: boolean;
  /**
   * When `true`, each message carries its `grants` reputation-grant summary.
   * Needed for grants to survive a reload or a scroll into history — the
   * `message:grant` socket event only covers grants issued while the
   * conversation is open.
   */
  includeGrants?: boolean;
}

export interface UseLiveChatMessagesValues {
  messages: ChatMessage[];
  loading: boolean;
  hasMore: boolean;
  loadOlder: () => Promise<void>;
}

/**
 * Live, store-backed view of a conversation's messages. Reads from the shared
 * Redux bucket that `ChatProvider` keeps in sync via socket events, so new
 * messages, edits, reactions and reply-count changes appear in real time, and
 * state is shared with `useSendMessage` (optimistic inserts), unread tracking
 * and reconnect catch-up.
 *
 * This is the canonical conversation surface. For a read-only / filtered query
 * that should NOT be polluted by live traffic, use
 * `useFetchManyChatMessagesWrapper` instead.
 */
function useLiveChatMessages({
  conversationId,
  parentMessageId,
  limit = 50,
  includeFiles,
  includeGrants,
}: UseLiveChatMessagesProps): UseLiveChatMessagesValues {
  const dispatch = useSublayDispatch();
  const { projectId } = useProject();
  const fetchMany = useFetchManyChatMessages();
  const { socket } = useChatContext();

  const isThread = Boolean(parentMessageId);

  // Read from the correct Redux bucket
  const mainMessages = useSublaySelector(selectMessages(conversationId));
  const mainLoading = useSublaySelector(selectMessagesLoading(conversationId));
  const mainHasMore = useSublaySelector(selectMessagesHasMore(conversationId));

  const threadMessages = useSublaySelector(
    selectThreadReplies(parentMessageId ?? "")
  );
  const threadLoading = useSublaySelector(selectThreadLoading(parentMessageId ?? ""));
  const threadHasMore = useSublaySelector(
    selectThreadHasMore(parentMessageId ?? "")
  );
  const threadCursor = useSublaySelector(
    selectThreadCursor(parentMessageId ?? "")
  );

  const messages = isThread ? threadMessages : mainMessages;
  const loading = isThread ? threadLoading : mainLoading;
  const hasMore = isThread ? threadHasMore : mainHasMore;

  // Keep fresh refs to message arrays so loadOlder can read cursors without
  // closing over stale state
  const mainMessagesRef = useRef(mainMessages);
  mainMessagesRef.current = mainMessages;
  const threadCursorRef = useRef(threadCursor);
  threadCursorRef.current = threadCursor;
  const threadHasMoreRef = useRef(threadHasMore);
  threadHasMoreRef.current = threadHasMore;

  // Fetch a page of messages.
  // `before` is an ISO 8601 timestamp — the server queries messages created
  // before this point in time (not a UUID cursor).
  const fetchPage = useCallback(
    async (before: string | null) => {
      if (!projectId || !conversationId) return;

      try {
        const { messages: items, hasMore: more } = await fetchMany({
          conversationId,
          parentMessageId,
          before,
          limit,
          sortDir: isThread ? "asc" : "desc",
          includeFiles,
          includeGrants,
        });

        if (isThread) {
          // Thread replies come back ASC. Merged, not replaced, so a live
          // reply that landed while this page was in flight is kept.
          dispatch(
            mergeThreadReplies({
              parentMessageId: parentMessageId!,
              messages: items,
              hasMore: more,
            })
          );
        } else {
          // Main stream comes back DESC (newest first for cursor efficiency).
          // Redux stores messages ASC — reverse before dispatching.
          const ascending = [...items].reverse();
          ascending.forEach((msg) => dispatch(upsertMessage(msg)));
          dispatch(setMessagesHasMore({ conversationId, hasMore: more }));
        }
      } catch (err) {
        handleError(err, "Failed to load messages");
      }
    },
    [projectId, conversationId, parentMessageId, isThread, limit, includeFiles, includeGrants, fetchMany, dispatch]
  );

  // Initial fetch on mount
  useEffect(() => {
    if (!projectId || !conversationId) return;

    const initialFetch = async () => {
      if (isThread) {
        dispatch(startThreadLoad({ parentMessageId: parentMessageId! }));
      } else {
        dispatch(setMessagesLoading({ conversationId, loading: true }));
      }

      await fetchPage(null);

      if (isThread) {
        dispatch(setThreadLoading({ parentMessageId: parentMessageId!, loading: false }));
      } else {
        dispatch(setMessagesLoading({ conversationId, loading: false }));
      }
    };

    initialFetch();
    // Re-runs on the conversation/thread identity AND on the two include
    // flags, which change what a message row CONTAINS: flipping `includeGrants`
    // (or `includeFiles`) on a mounted hook has to refetch, or the caller has
    // toggled a prop that silently does nothing until the conversation changes.
    //
    // `fetchPage` is deliberately left out even though it is called here. It is
    // a `useCallback` over exactly these deps plus `fetchMany`/`dispatch`, so
    // listing it would add nothing but the risk of a refetch loop if either of
    // those two ever stops being stable. The two flags are primitives, so no
    // re-render can re-arm this effect on identity alone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, conversationId, parentMessageId, includeFiles, includeGrants]);

  // Load more messages:
  // - Main stream: fetch older messages using `before` cursor (oldest loaded createdAt)
  // - Thread: fetch newer replies using the thread's `after` cursor (the newest
  //   reply fetched in order — not the newest loaded, which may be a live
  //   reply beyond a gap), merge
  const loadOlder = useCallback(async () => {
    if (loading || !hasMore) return;

    if (isThread) {
      const cursor = threadCursorRef.current;
      if (!cursor || !parentMessageId || !projectId || !conversationId) return;

      const after = new Date(cursor).toISOString();
      dispatch(setThreadLoading({ parentMessageId: parentMessageId, loading: true }));
      try {
        const { messages: newItems, hasMore: more } = await fetchMany({
          conversationId,
          parentMessageId,
          after,
          limit,
          sortDir: "asc",
          includeFiles,
          includeGrants,
        });
        dispatch(
          mergeThreadReplies({
            parentMessageId: parentMessageId,
            messages: newItems,
            hasMore: more,
          })
        );
      } catch (err) {
        handleError(err, "Failed to load more thread replies");
      } finally {
        dispatch(setThreadLoading({ parentMessageId: parentMessageId, loading: false }));
      }
      return;
    }

    const oldest = mainMessagesRef.current[0];
    if (!oldest) return;

    const before = new Date(oldest.createdAt).toISOString();
    dispatch(setMessagesLoading({ conversationId, loading: true }));
    await fetchPage(before);
    dispatch(setMessagesLoading({ conversationId, loading: false }));
  }, [loading, hasMore, isThread, parentMessageId, projectId, conversationId, limit, includeFiles, includeGrants, fetchMany, dispatch, fetchPage]);

  // Thread reconnect catch-up: fetch the replies sent while the socket was
  // down. Page forward from the newest reply fetched in order until the server
  // has no more; with none fetched yet (an empty thread, or a first load that
  // failed), load the first page only, as on open, and leave the rest to
  // `loadOlder`. A thread whose fetched run hasn't
  // reached the end needs nothing: newer replies come in through `loadOlder`.
  // The main stream's catch-up lives in ConversationProvider, which also
  // re-joins the room; a thread shares its conversation's room.
  const catchUpReplies = useCallback(async () => {
    if (!projectId || !conversationId || !parentMessageId) return;
    if (threadCursorRef.current && threadHasMoreRef.current) return;

    let after = threadCursorRef.current
      ? new Date(threadCursorRef.current).toISOString()
      : null;
    try {
      while (true) {
        const page = await fetchMany({
          conversationId,
          parentMessageId,
          after,
          limit: after === null ? limit : 100,
          sortDir: "asc",
          includeFiles,
          includeGrants,
        });
        dispatch(
          mergeThreadReplies({
            parentMessageId,
            messages: page.messages,
            hasMore: page.hasMore,
          })
        );
        // Stop after a first page, when the server is done, or if the cursor
        // didn't move.
        if (
          after === null ||
          !page.hasMore ||
          !page.newestCreatedAt ||
          page.newestCreatedAt === after
        ) {
          break;
        }
        after = page.newestCreatedAt;
      }
    } catch (err) {
      handleError(err, "Failed to fetch missed thread replies");
    }
  }, [projectId, conversationId, parentMessageId, limit, includeFiles, includeGrants, fetchMany, dispatch]);

  useEffect(() => {
    if (!socket || !isThread) return;

    // socket.on("connect") fires on the initial connect too; skip that one.
    const hasConnectedOnceRef = { current: socket.connected };

    const handleConnect = async () => {
      if (!hasConnectedOnceRef.current) {
        hasConnectedOnceRef.current = true;
        return;
      }
      await catchUpReplies();
    };

    socket.on("connect", handleConnect);
    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket, isThread, catchUpReplies]);

  return { messages, loading, hasMore, loadOlder };
}

export default useLiveChatMessages;
