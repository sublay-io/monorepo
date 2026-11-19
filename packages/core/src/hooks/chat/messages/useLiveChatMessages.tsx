import { useCallback, useEffect, useMemo, useRef } from "react";
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
import {
  ChatMessage,
  ChatMessageListInclude,
  ChatMessageListIncludeParam,
} from "../../../interfaces/models/ChatMessage";
import useProject from "../../projects/useProject";
import { handleError } from "../../../utils/handleError";
import { useChatContext } from "../../../context/chat-context";
import useFetchManyChatMessages, {
  isInvalidChatCursorError,
} from "./useFetchManyChatMessages";

export interface UseLiveChatMessagesProps {
  conversationId: string;
  parentMessageId?: string | null;
  limit?: number;
  /**
   * Opt-in fields on each message, one value or an array: `"files"` populates
   * `files`, `"grants"` the `grants` reputation-grant summary. Ask for
   * `"grants"` to keep grants across a reload or a scroll into history — the
   * `message:grant` socket event only covers grants issued while the
   * conversation is open.
   */
  include?: ChatMessageListIncludeParam;
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
  include: includeProp,
}: UseLiveChatMessagesProps): UseLiveChatMessagesValues {
  const dispatch = useSublayDispatch();
  const { projectId } = useProject();
  const fetchMany = useFetchManyChatMessages();
  const { socket } = useChatContext();

  const isThread = Boolean(parentMessageId);

  // A primitive key, so a fresh array each render doesn't re-run the fetches.
  const includeKey = Array.isArray(includeProp)
    ? includeProp.join(",")
    : includeProp ?? "";
  const include = useMemo(
    () =>
      includeKey ? (includeKey.split(",") as ChatMessageListInclude[]) : undefined,
    [includeKey]
  );

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

  // Fetch a page of messages. `before` is the id of the oldest message held
  // (null for the first page).
  const fetchPage = useCallback(
    async (before: string | null) => {
      if (!projectId || !conversationId) return;

      try {
        const {
          data: items,
          pagination: { hasMore: more },
        } = await fetchMany({
          conversationId,
          parentMessageId,
          before,
          limit,
          sortDir: isThread ? "asc" : "desc",
          include,
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
    [projectId, conversationId, parentMessageId, isThread, limit, include, fetchMany, dispatch]
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
    // Re-runs on the conversation/thread identity AND on `include`, which
    // changes what a message row CONTAINS: adding or dropping "grants" (or
    // "files") on a mounted hook has to refetch, or the caller has changed a
    // prop that silently does nothing until the conversation changes.
    //
    // `fetchPage` is deliberately left out even though it is called here. It is
    // a `useCallback` over exactly these deps plus `fetchMany`/`dispatch`, so
    // listing it would add nothing but the risk of a refetch loop if either of
    // those two ever stops being stable. `includeKey` is a primitive, so no
    // re-render can re-arm this effect on identity alone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, conversationId, parentMessageId, includeKey]);

  // Load more messages:
  // - Main stream: fetch older messages `before` the oldest loaded message's id
  // - Thread: fetch newer replies `after` the thread cursor's id (the newest
  //   reply fetched in order — not the newest loaded, which may be a live
  //   reply beyond a gap), merge
  const loadOlder = useCallback(async () => {
    if (loading || !hasMore) return;

    if (isThread) {
      const cursor = threadCursorRef.current;
      if (!cursor || !parentMessageId || !projectId || !conversationId) return;

      dispatch(setThreadLoading({ parentMessageId: parentMessageId, loading: true }));
      try {
        const {
          data: newItems,
          pagination: { hasMore: more },
        } = await fetchMany({
          conversationId,
          parentMessageId,
          after: cursor.id,
          limit,
          sortDir: "asc",
          include,
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

    // Optimistic `temp-` messages have no server row to page from.
    const oldest = mainMessagesRef.current.find((m) => !m.id.startsWith("temp-"));
    if (!oldest) return;

    dispatch(setMessagesLoading({ conversationId, loading: true }));
    await fetchPage(oldest.id);
    dispatch(setMessagesLoading({ conversationId, loading: false }));
  }, [loading, hasMore, isThread, parentMessageId, projectId, conversationId, limit, include, fetchMany, dispatch, fetchPage]);

  // Thread reconnect catch-up: fetch the replies sent while the socket was
  // down. Page forward from the newest reply fetched in order (by its id) until
  // the server has no more; with none fetched yet (an empty thread, or a first
  // load that failed), load the first page only, as on open, and leave the rest
  // to `loadOlder`. A thread whose fetched run hasn't reached the end needs
  // nothing: newer replies come in through `loadOlder`. If the server can't
  // page from the cursor (`chat/invalid-cursor`: that reply is gone), the
  // thread is reloaded from its first page, once. The main stream's catch-up
  // lives in ConversationProvider, which also re-joins the room; a thread
  // shares its conversation's room.
  const catchUpReplies = useCallback(async () => {
    if (!projectId || !conversationId || !parentMessageId) return;
    if (threadCursorRef.current && threadHasMoreRef.current) return;

    const fetchReplies = (after: string | null) =>
      fetchMany({
        conversationId,
        parentMessageId,
        after,
        limit: after === null ? limit : 100,
        sortDir: "asc",
        include,
      });
    const merge = (page: Awaited<ReturnType<typeof fetchReplies>>) =>
      dispatch(
        mergeThreadReplies({
          parentMessageId,
          messages: page.data,
          hasMore: page.pagination.hasMore,
        })
      );

    let after = threadCursorRef.current?.id ?? null;
    try {
      while (true) {
        let page: Awaited<ReturnType<typeof fetchReplies>>;
        try {
          page = await fetchReplies(after);
        } catch (err) {
          if (after === null || !isInvalidChatCursorError(err)) throw err;
          // Start the fetched run over, as on open: forgetting the cursor
          // keeps the next `loadOlder` from paging from it again.
          dispatch(startThreadLoad({ parentMessageId }));
          try {
            merge(await fetchReplies(null));
          } finally {
            dispatch(setThreadLoading({ parentMessageId, loading: false }));
          }
          return;
        }
        merge(page);
        // Stop after a first page, when the server is done, or if the cursor
        // didn't move.
        const last = page.data[page.data.length - 1];
        if (
          after === null ||
          !page.pagination.hasMore ||
          !last ||
          last.id === after
        ) {
          break;
        }
        after = last.id;
      }
    } catch (err) {
      handleError(err, "Failed to fetch missed thread replies");
    }
  }, [projectId, conversationId, parentMessageId, limit, include, fetchMany, dispatch]);

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
