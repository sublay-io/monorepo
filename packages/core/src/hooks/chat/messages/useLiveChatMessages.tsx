import { useCallback, useEffect, useMemo, useRef } from "react";
import { useStore } from "react-redux";
import { useSublayDispatch, useSublaySelector } from "../../../store/hooks";
import type { SublayState } from "../../../store/sublayReducers";
import {
  runSharedListLoad,
  sharedLoadMore,
  useSharedListStatus,
} from "../../list/sharedListStatus";
import {
  selectMessages,
  selectMessagesLoading,
  selectMessagesHasMore,
  selectThreadReplies,
  selectThreadLoading,
  selectThreadHasMore,
  selectThreadCursor,
  upsertMessage,
  replaceMessages,
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
  /**
   * The last load failure, shared by every hook showing this conversation (or
   * thread). Cleared when the next load starts; `loadMore()` retries it.
   */
  error: Error | null;
  /** Whether `loadMore()` has anything to fetch: a next page, or a load that failed. */
  hasMore: boolean;
  /**
   * Load the next page in reading order: older messages in a conversation,
   * newer replies in a thread (`parentMessageId`). Retries the load that
   * failed (a failed first page included). Does nothing while a page is
   * loading or when there is nothing more. Never rejects.
   */
  loadMore: () => Promise<void>;
  /**
   * Reload from the first page: a conversation's latest messages replace the
   * ones loaded (optimistic and newer live messages are kept); a thread
   * starts over from its first reply. Never rejects.
   */
  refetch: () => Promise<void>;
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

  // Kept fresh for the reconnect catch-up.
  const threadCursorRef = useRef(threadCursor);
  threadCursorRef.current = threadCursor;
  const threadHasMoreRef = useRef(threadHasMore);
  threadHasMoreRef.current = threadHasMore;

  // Load bookkeeping shared by every hook showing this conversation (or
  // thread).
  const store = useStore<{ sublay: SublayState }>();
  const { status, error } = useSharedListStatus(
    isThread ? `chatThread:${parentMessageId}` : `chatMessages:${conversationId}`
  );

  // - "open": the first page, as on mount. Main stream: merged into the
  //   messages already held (a conversation opened before keeps them).
  //   Thread: the fetched run starts over.
  // - "refetch": the first page as a fresh start. Main stream: replaces the
  //   loaded messages (`replaceMessages`). Thread: same as "open".
  // - "next": the next page in reading order. Main stream: older messages,
  //   `before` the oldest loaded one. Thread: newer replies, `after` the
  //   thread cursor (the newest reply fetched in order — not the newest
  //   loaded, which may be a live reply beyond a gap).
  const loadPage = useCallback(
    (kind: "open" | "refetch" | "next") =>
      runSharedListLoad(
        status,
        {
          first: kind !== "next",
          // Opening only adds to what is held: a provider and a child
          // opening the same conversation with different `include`s both
          // land (merged by id). A refetch starts over.
          supersede: kind === "refetch",
          kind,
          errorLabel: isThread
            ? "Failed to load thread replies:"
            : "Failed to load messages:",
        },
        async (isCurrent) => {
          if (!projectId || !conversationId) return;

          if (isThread) {
            const threadId = parentMessageId!;
            let after: string | undefined;
            if (kind === "next") {
              const cursor = selectThreadCursor(threadId)(store.getState());
              if (!cursor) return;
              after = cursor.id;
              dispatch(setThreadLoading({ parentMessageId: threadId, loading: true }));
            } else {
              dispatch(startThreadLoad({ parentMessageId: threadId }));
            }
            try {
              const {
                data: items,
                pagination: { hasMore: more },
              } = await fetchMany({
                conversationId,
                parentMessageId: threadId,
                ...(after === undefined ? { before: null } : { after }),
                limit,
                sortDir: "asc",
                include,
              });
              if (!isCurrent()) return;
              // Thread replies come back ASC. Merged, not replaced, so a live
              // reply that landed while this page was in flight is kept.
              dispatch(
                mergeThreadReplies({
                  parentMessageId: threadId,
                  messages: items,
                  hasMore: more,
                })
              );
            } finally {
              if (isCurrent()) {
                dispatch(setThreadLoading({ parentMessageId: threadId, loading: false }));
              }
            }
            return;
          }

          let before: string | null = null;
          if (kind === "next") {
            // Optimistic `temp-` messages have no server row to page from.
            const oldest = selectMessages(conversationId)(store.getState()).find(
              (m) => !m.id.startsWith("temp-")
            );
            if (!oldest) return;
            before = oldest.id;
          }
          dispatch(setMessagesLoading({ conversationId, loading: true }));
          try {
            const {
              data: items,
              pagination: { hasMore: more },
            } = await fetchMany({
              conversationId,
              parentMessageId,
              before,
              limit,
              sortDir: "desc",
              include,
            });
            if (!isCurrent()) return;
            // Main stream comes back DESC (newest first for cursor efficiency).
            // Redux stores messages ASC — reverse before dispatching.
            const ascending = [...items].reverse();
            if (kind === "refetch") {
              dispatch(
                replaceMessages({ conversationId, messages: ascending, hasMore: more })
              );
            } else {
              ascending.forEach((msg) => dispatch(upsertMessage(msg)));
              dispatch(setMessagesHasMore({ conversationId, hasMore: more }));
            }
          } finally {
            if (isCurrent()) {
              dispatch(setMessagesLoading({ conversationId, loading: false }));
            }
          }
        }
      ),
    [status, store, projectId, conversationId, parentMessageId, isThread, limit, include, fetchMany, dispatch]
  );

  // Initial fetch on mount
  useEffect(() => {
    if (!projectId || !conversationId) return;
    loadPage("open");
    // Re-runs on the conversation/thread identity AND on `include`, which
    // changes what a message row CONTAINS: adding or dropping "grants" (or
    // "files") on a mounted hook has to refetch, or the caller has changed a
    // prop that silently does nothing until the conversation changes.
    //
    // `loadPage` is deliberately left out even though it is called here. It
    // is a `useCallback` over exactly these deps plus stable references
    // (`status`, `store`, `fetchMany`, `dispatch`), so listing it would add
    // nothing but the risk of a refetch loop if one of those ever stops being
    // stable. `includeKey` is a primitive, so no re-render can re-arm this
    // effect on identity alone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, conversationId, parentMessageId, includeKey]);

  // The next page in reading order (older messages; newer thread replies), or
  // a retry of the load that failed.
  const loadMore = useCallback(async () => {
    if (!projectId || !conversationId) return;
    await sharedLoadMore(status, {
      hasMore: () => {
        const state = store.getState();
        return isThread
          ? selectThreadHasMore(parentMessageId!)(state)
          : selectMessagesHasMore(conversationId)(state);
      },
      // A failed refetch is retried as a refetch (a fresh start), so no gap
      // is left between what was held and the latest page.
      retryFirst: (failedKind) =>
        loadPage(failedKind === "refetch" ? "refetch" : "open"),
      next: () => loadPage("next"),
    });
  }, [projectId, conversationId, parentMessageId, isThread, status, store, loadPage]);

  const refetch = useCallback(async () => {
    if (!projectId || !conversationId) return;
    await loadPage("refetch");
  }, [projectId, conversationId, loadPage]);

  // Thread reconnect catch-up: fetch the replies sent while the socket was
  // down. Page forward from the newest reply fetched in order (by its id) until
  // the server has no more; with none fetched yet (an empty thread, or a first
  // load that failed), load the first page only, as on open, and leave the rest
  // to `loadMore`. A thread whose fetched run hasn't reached the end needs
  // nothing: newer replies come in through `loadMore`. If the server can't
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
          // keeps the next `loadMore` from paging from it again, and a page
          // still in flight from it is dropped.
          status.invalidate();
          dispatch(startThreadLoad({ parentMessageId }));
          try {
            merge(await fetchReplies(null));
          } finally {
            dispatch(setThreadLoading({ parentMessageId, loading: false }));
          }
          status.clearFailure();
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
      // The thread is up to date: a failed load is no longer pending.
      status.clearFailure();
    } catch (err) {
      handleError(err, "Failed to fetch missed thread replies");
    }
  }, [projectId, conversationId, parentMessageId, limit, include, fetchMany, dispatch, status]);

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

  return {
    messages,
    loading,
    error,
    // A failed load is still to do: `loadMore()` retries it.
    hasMore: hasMore || error !== null,
    loadMore,
    refetch,
  };
}

export default useLiveChatMessages;
