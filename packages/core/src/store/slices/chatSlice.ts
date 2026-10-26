import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { resetAccountScopedState } from "../actions";
import type {
  Conversation,
  ConversationPreview,
} from "../../interfaces/models/Conversation";
import type { ChatMessage } from "../../interfaces/models/ChatMessage";
import type { ReputationGrant } from "../../interfaces/models/ReputationGrant";
import type { SublayState } from "../sublayReducers";

// ─── Sub-state shapes ────────────────────────────────────────────────────────

interface ConversationEntry {
  data: Conversation | null;
  loading: boolean;
  error: string | null;
}

interface MessagesBucket {
  items: ChatMessage[];
  loading: boolean;
  hasMore: boolean;
  // ID of the oldest message currently loaded — cursor for "load older" requests
  oldestMessageId: string | null;
  // ID of the newest message currently loaded — cursor for catch-up on socket reconnect
  newestMessageId: string | null;
}

interface ThreadBucket {
  items: ChatMessage[];
  loading: boolean;
  // Whether the server has newer replies than the fetched run (threads load
  // oldest first, so "more" is at the newest end)
  hasMore: boolean;
  // createdAt of the newest reply in the unbroken run fetched from the start of
  // the thread — the `after` cursor for loading more and for reconnect
  // catch-up. A live reply that lands while `hasMore` is true sits beyond a gap
  // and doesn't advance it; one that lands at the end does.
  cursor: string | null;
}

// ─── State ───────────────────────────────────────────────────────────────────

export interface ChatState {
  // Individual conversation detail, keyed by conversationId
  conversations: Record<string, ConversationEntry>;
  // Flat sorted list used for the inbox / conversation-list view
  conversationList: {
    items: ConversationPreview[];
    loading: boolean;
    hasMore: boolean;
    // lastMessageAt ISO string of the oldest loaded preview — next-page cursor
    cursor: string | null;
  };
  // Messages keyed by conversationId; stored ASC (oldest first, newest at end)
  messages: Record<string, MessagesBucket>;
  // Thread replies keyed by parentMessageId; stored ASC
  threads: Record<string, ThreadBucket>;
  // userIds currently typing, keyed by conversationId
  typingUsers: Record<string, string[]>;
  socketConnected: boolean;
  // Global unread totals — fetched on ChatProvider mount, kept in sync via socket events.
  // null means not yet fetched (use 0 as display fallback).
  totalUnreadCount: number | null;
  unreadConversationCount: number | null;
}

const initialState: ChatState = {
  conversations: {},
  conversationList: {
    items: [],
    loading: false,
    hasMore: true,
    cursor: null,
  },
  messages: {},
  threads: {},
  typingUsers: {},
  socketConnected: false,
  totalUnreadCount: null,
  unreadConversationCount: null,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Sort previews by lastMessageAt DESC, placing null values last. */
function sortPreviews(items: ConversationPreview[]): void {
  items.sort((a, b) => {
    if (!a.lastMessageAt && !b.lastMessageAt) return 0;
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return (
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  });
}

/** Return a fresh MessagesBucket with safe defaults. */
function emptyBucket(): MessagesBucket {
  return {
    items: [],
    loading: false,
    hasMore: true,
    oldestMessageId: null,
    newestMessageId: null,
  };
}

/**
 * Recompute oldestMessageId / newestMessageId cursors from the current items.
 * Temp IDs (prefixed "temp-") are excluded from cursor tracking because they
 * cannot be used as valid server-side pagination cursors.
 */
function refreshCursors(bucket: MessagesBucket): void {
  const realItems = bucket.items.filter((m) => !m.id.startsWith("temp-"));
  bucket.oldestMessageId = realItems.length > 0 ? realItems[0].id : null;
  bucket.newestMessageId =
    realItems.length > 0 ? realItems[realItems.length - 1].id : null;
}

/**
 * Every loaded copy of one message, across both buckets it can live in.
 *
 * The main stream (`state.messages[conversationId]`) holds top-level messages
 * only, matching the server's message list (which filters
 * `parentMessageId: null`); thread replies live only in their thread bucket
 * (`state.threads[parentMessageId]`). A thread's parent message can be loaded
 * in both — as a main-stream message and as the head of an open thread view —
 * so this returns a list rather than a first match.
 *
 * `threads` is keyed by parentMessageId, which message-scoped socket payloads
 * don't carry, so the thread side is a scan. It is bounded by the number of
 * open threads (in practice zero or one). `conversationId` is optional so a
 * payload from a server that omits it still reaches thread replies.
 */
function findLoadedMessages(
  state: ChatState,
  conversationId: string | undefined,
  messageId: string
): ChatMessage[] {
  const found: ChatMessage[] = [];

  const inConversation = conversationId
    ? state.messages[conversationId]?.items.find((m) => m.id === messageId)
    : undefined;
  if (inConversation) found.push(inConversation);

  for (const bucket of Object.values(state.threads)) {
    const reply = bucket.items.find((m) => m.id === messageId);
    if (reply) found.push(reply);
  }

  return found;
}

/**
 * Add or update a message in an ASC-ordered list.
 *
 * Deduplication order:
 *  1. Match by real `id` → update in-place (handles socket events after REST)
 *  2. Match by `localId` → replace optimistic placeholder with confirmed message
 *  3. Otherwise insert, maintaining chronological ASC order
 */
function upsertInto(items: ChatMessage[], message: ChatMessage): void {
  const byIdIndex = items.findIndex((m) => m.id === message.id);
  if (byIdIndex !== -1) {
    items[byIdIndex] = message;
    return;
  }

  if (message.localId) {
    const byClientIndex = items.findIndex((m) => m.localId === message.localId);
    if (byClientIndex !== -1) {
      items[byClientIndex] = message;
      return;
    }
  }

  const insertAt = items.findIndex(
    (m) =>
      new Date(m.createdAt).getTime() > new Date(message.createdAt).getTime()
  );
  if (insertAt === -1) {
    items.push(message);
  } else {
    items.splice(insertAt, 0, message);
  }
}

/** The later of a thread cursor and the newest real reply in `messages`. */
function advanceCursor(
  cursor: string | null,
  messages: ChatMessage[]
): string | null {
  let newest = cursor;
  for (const m of messages) {
    if (m.id.startsWith("temp-")) continue;
    if (!newest || new Date(m.createdAt).getTime() > new Date(newest).getTime()) {
      newest = m.createdAt;
    }
  }
  return newest;
}

// ─── Slice ───────────────────────────────────────────────────────────────────

// Not exported directly — use the actions below and the default reducer export.
// Exporting the slice itself causes TS4023 due to immer's internal WritableNonArrayDraft type.
const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // ── Conversation actions ─────────────────────────────────────────────────

    /**
     * Upsert a single conversation into the conversations map AND patch the
     * matching preview in conversationList.items so both stores stay in sync.
     */
    setConversation(state, action: PayloadAction<Conversation>) {
      const conversation = action.payload;
      const { id } = conversation;

      if (!state.conversations[id]) {
        state.conversations[id] = { data: null, loading: false, error: null };
      }
      state.conversations[id].data = conversation;
      state.conversations[id].loading = false;
      state.conversations[id].error = null;

      // Patch the matching preview in the list if it exists
      const previewIndex = state.conversationList.items.findIndex(
        (c) => c.id === id
      );
      if (previewIndex !== -1) {
        Object.assign(state.conversationList.items[previewIndex], conversation);
      }
    },

    setConversationLoading(
      state,
      action: PayloadAction<{ conversationId: string; loading: boolean }>
    ) {
      const { conversationId, loading } = action.payload;
      if (!state.conversations[conversationId]) {
        state.conversations[conversationId] = {
          data: null,
          loading,
          error: null,
        };
      } else {
        state.conversations[conversationId].loading = loading;
      }
    },

    /** Replace the entire conversation list (first-page load or refresh). */
    setConversationList(state, action: PayloadAction<ConversationPreview[]>) {
      state.conversationList.items = action.payload;
    },

    setConversationListLoading(state, action: PayloadAction<boolean>) {
      state.conversationList.loading = action.payload;
    },

    setConversationListHasMore(state, action: PayloadAction<boolean>) {
      state.conversationList.hasMore = action.payload;
    },

    setConversationListCursor(state, action: PayloadAction<string | null>) {
      state.conversationList.cursor = action.payload;
    },

    /**
     * Update lastMessageAt / lastMessage / unreadCount on a preview item, then
     * re-sort the list by lastMessageAt DESC NULLS LAST. Also patches
     * conversations[id].data so a split-screen layout (sidebar + chat view)
     * stays in sync without a separate fetch.
     */
    upsertConversationPreview(
      state,
      action: PayloadAction<{
        conversationId: string;
        patch: Partial<ConversationPreview>;
      }>
    ) {
      const { conversationId, patch } = action.payload;

      const previewIndex = state.conversationList.items.findIndex(
        (c) => c.id === conversationId
      );
      if (previewIndex !== -1) {
        Object.assign(state.conversationList.items[previewIndex], patch);
        sortPreviews(state.conversationList.items);
      }

      // Mirror the patch into the individual conversation entry if loaded
      if (state.conversations[conversationId]?.data) {
        Object.assign(state.conversations[conversationId].data!, patch);
      }
    },

    /**
     * Insert a full ConversationPreview into the inbox list. If a preview with
     * the same id already exists, patch it in place (idempotent — no duplicate,
     * no positional change unless lastMessageAt changed). On a fresh insert the
     * list is re-sorted by lastMessageAt DESC NULLS LAST.
     *
     * Deliberately does NOT touch totalUnreadCount / unreadConversationCount:
     * those globals are owned by setUnreadSummary / increment / clearUnread, and
     * folding an inserted preview's unreadCount into them is the double-count
     * trap the live-list plan calls out.
     */
    insertConversationPreview(
      state,
      action: PayloadAction<ConversationPreview>
    ) {
      const preview = action.payload;
      const existingIndex = state.conversationList.items.findIndex(
        (c) => c.id === preview.id
      );

      if (existingIndex !== -1) {
        // Patch in place — idempotent on repeat
        Object.assign(state.conversationList.items[existingIndex], preview);
      } else {
        state.conversationList.items.push(preview);
      }
      sortPreviews(state.conversationList.items);

      // Mirror into the individual conversation entry like the existing upsert
      if (!state.conversations[preview.id]) {
        state.conversations[preview.id] = {
          data: null,
          loading: false,
          error: null,
        };
      }
      state.conversations[preview.id].data = preview;
    },

    /**
     * Remove a conversation preview from the inbox list.
     *
     * If the removed row was loaded (present in the list) and carried unread
     * messages, adjust the globals exactly as clearUnread would: decrement
     * totalUnreadCount by its unreadCount and unreadConversationCount by 1
     * (clamped at 0). If the conversation was NOT loaded we cannot know its
     * unread count, so we leave the globals to the debounced summary refetch —
     * guessing here is the double-count trap.
     */
    removeConversationPreview(state, action: PayloadAction<string>) {
      const conversationId = action.payload;
      const index = state.conversationList.items.findIndex(
        (c) => c.id === conversationId
      );

      if (index !== -1) {
        const prevCount = state.conversationList.items[index].unreadCount ?? 0;
        state.conversationList.items.splice(index, 1);
        if (prevCount > 0) {
          if (state.totalUnreadCount !== null) {
            state.totalUnreadCount = Math.max(
              0,
              state.totalUnreadCount - prevCount
            );
          }
          if (state.unreadConversationCount !== null) {
            state.unreadConversationCount = Math.max(
              0,
              state.unreadConversationCount - 1
            );
          }
        }
      }

      // Drop any cached detail / message buckets for the removed conversation
      delete state.conversations[conversationId];
      delete state.messages[conversationId];
    },

    incrementUnread(state, action: PayloadAction<string>) {
      const conversationId = action.payload;
      const preview = state.conversationList.items.find(
        (c) => c.id === conversationId
      );
      if (preview) {
        const wasZero = (preview.unreadCount ?? 0) === 0;
        preview.unreadCount = (preview.unreadCount ?? 0) + 1;
        // Only bump conversation count if this conversation just became unread
        if (wasZero && state.unreadConversationCount !== null) {
          state.unreadConversationCount += 1;
        }
      }
      // Always bump total — even if conversation not in the loaded list
      if (state.totalUnreadCount !== null) {
        state.totalUnreadCount += 1;
      }
    },

    clearUnread(state, action: PayloadAction<string>) {
      const conversationId = action.payload;
      const preview = state.conversationList.items.find(
        (c) => c.id === conversationId
      );
      if (preview) {
        const prevCount = preview.unreadCount ?? 0;
        preview.unreadCount = 0;
        if (prevCount > 0) {
          if (state.totalUnreadCount !== null) {
            state.totalUnreadCount = Math.max(0, state.totalUnreadCount - prevCount);
          }
          if (state.unreadConversationCount !== null) {
            state.unreadConversationCount = Math.max(0, state.unreadConversationCount - 1);
          }
        }
      }
    },

    /** Initialize global unread totals from the server on ChatProvider mount. */
    setUnreadSummary(
      state,
      action: PayloadAction<{ totalUnread: number; unreadConversationCount: number }>
    ) {
      state.totalUnreadCount = action.payload.totalUnread;
      state.unreadConversationCount = action.payload.unreadConversationCount;
    },

    // ── Message actions ──────────────────────────────────────────────────────

    setMessagesLoading(
      state,
      action: PayloadAction<{ conversationId: string; loading: boolean }>
    ) {
      const { conversationId, loading } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = emptyBucket();
      }
      state.messages[conversationId].loading = loading;
    },

    setMessagesHasMore(
      state,
      action: PayloadAction<{ conversationId: string; hasMore: boolean }>
    ) {
      const { conversationId, hasMore } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = emptyBucket();
      }
      state.messages[conversationId].hasMore = hasMore;
    },

    /**
     * Add or update a message where it belongs: a top-level message in its
     * conversation bucket, a thread reply in its thread bucket. A reply whose
     * thread isn't loaded is dropped — the main stream never holds replies,
     * and the parent's `threadReplyCount` arrives on its own event. See
     * `upsertInto` for deduplication.
     */
    upsertMessage(state, action: PayloadAction<ChatMessage>) {
      const message = action.payload;
      const { conversationId, parentMessageId } = message;

      if (parentMessageId) {
        const thread = state.threads[parentMessageId];
        if (!thread) return;
        upsertInto(thread.items, message);
        if (!thread.hasMore) {
          thread.cursor = advanceCursor(thread.cursor, [message]);
        }
        return;
      }

      if (!state.messages[conversationId]) {
        state.messages[conversationId] = emptyBucket();
      }
      const bucket = state.messages[conversationId];
      upsertInto(bucket.items, message);
      refreshCursors(bucket);
    },

    /**
     * Insert a pending optimistic message with a `temp-{uuid}` id immediately
     * before the POST fires. The message is replaced by upsertMessage when the
     * server response arrives (matched via localId).
     */
    addOptimisticMessage(state, action: PayloadAction<ChatMessage>) {
      const message = action.payload;
      const { conversationId, parentMessageId } = message;

      if (parentMessageId) {
        state.threads[parentMessageId]?.items.push(message);
        return;
      }

      if (!state.messages[conversationId]) {
        state.messages[conversationId] = emptyBucket();
      }
      // Optimistic messages are always the newest — append to end
      state.messages[conversationId].items.push(message);
      // Do NOT update cursor IDs — temp IDs are not valid pagination cursors
    },

    /**
     * Mark a failed optimistic message with sendFailed: true so the UI can
     * show a retry prompt. The message is NOT removed from the list.
     */
    failOptimisticMessage(
      state,
      action: PayloadAction<{ conversationId: string; localId: string }>
    ) {
      const { conversationId, localId } = action.payload;
      const buckets = [
        state.messages[conversationId],
        ...Object.values(state.threads),
      ];
      for (const bucket of buckets) {
        const message = bucket?.items.find((m) => m.localId === localId);
        if (message) {
          message.sendFailed = true;
          return;
        }
      }
    },

    /**
     * Soft-delete a message by marking it with the current time as userDeletedAt
     * and clearing its content. Matches server behavior (Reddit-style placeholder).
     */
    removeMessage(
      state,
      action: PayloadAction<{ conversationId: string; messageId: string }>
    ) {
      const { conversationId, messageId } = action.payload;
      for (const message of findLoadedMessages(state, conversationId, messageId)) {
        message.userDeletedAt = new Date().toISOString();
        message.content = null;
        message.gif = null;
        message.mentions = [];
        message.metadata = {};
        message.files = undefined;
      }
    },

    /**
     * Update the reactionCounts map on every loaded copy of a message (main
     * stream and thread replies, see `findLoadedMessages`). If userId matches
     * the current user, add or remove the emoji from userReactions accordingly.
     * Dispatched by ChatProvider on `message:reaction` socket events and by
     * `useToggleReaction` optimistically.
     */
    updateReactions(
      state,
      action: PayloadAction<{
        conversationId?: string;
        messageId: string;
        reactionCounts: Record<string, number>;
        userId: string;
        emoji: string;
        delta: 1 | -1;
        currentUserId: string;
      }>
    ) {
      const {
        conversationId,
        messageId,
        reactionCounts,
        userId,
        emoji,
        delta,
        currentUserId,
      } = action.payload;

      for (const message of findLoadedMessages(state, conversationId, messageId)) {
        message.reactionCounts = reactionCounts;

        // Keep userReactions in sync for the current user only
        if (userId === currentUserId) {
          if (delta === 1) {
            if (!message.userReactions.includes(emoji)) {
              message.userReactions.push(emoji);
            }
          } else {
            message.userReactions = message.userReactions.filter(
              (e) => e !== emoji
            );
          }
        }
      }
    },

    /**
     * Merge fields into every loaded copy of a message (see
     * `findLoadedMessages`). Dispatched by ChatProvider for the message-scoped
     * socket events (edit, delete, removal, reply count), so they reach thread
     * replies as well as the main stream. No-ops when the message isn't loaded.
     */
    patchMessage(
      state,
      action: PayloadAction<{
        conversationId?: string;
        messageId: string;
        patch: Partial<ChatMessage>;
      }>
    ) {
      const { conversationId, messageId, patch } = action.payload;
      for (const message of findLoadedMessages(state, conversationId, messageId)) {
        Object.assign(message, patch);
      }
    },

    /**
     * Apply a reputation grant that landed on a message.
     *
     * Dispatched by ChatProvider on `message:grant` socket events. Silently
     * no-ops when the message isn't loaded anywhere.
     *
     * Like `updateReactions`, this looks in the thread buckets as well as the
     * conversation bucket (see `findLoadedMessages`). Thread replies are a
     * grants-rendering surface — `useLiveChatMessages` passes `includeGrants`
     * on the thread fetch path too — so a reducer that only reached
     * `state.messages` would render a reply's grant total on load and then
     * never update it live.
     *
     * `total`/`count` come straight from the server, which recomputes them from
     * the table on every event so a client that missed one still reconciles.
     * `viewerTotal` is NOT in the payload — it is per-viewer and this is a room
     * broadcast — so it is derived here from the grant's own `senderId` and
     * `amount`, exactly as `updateReactions` derives `userReactions` from
     * `userId` + `delta`.
     *
     * ## The seam with the fetched summary
     * A message loaded with `includeGrants: true` already carries a summary.
     * The two mechanisms compose because only ONE field is incremental: the
     * absolute `total`/`count` are overwritten (so they can never drift or
     * double-count), and `viewerTotal` accrues on top of the fetched baseline.
     *
     * When the message was fetched WITHOUT `includeGrants` there is no
     * baseline, so `viewerTotal` starts at 0 and reflects only grants seen
     * live. `total`/`count` are exact either way. An app that renders the
     * viewer's own figure should pass `includeGrants: true`.
     */
    updateGrants(
      state,
      action: PayloadAction<{
        conversationId: string;
        messageId: string;
        grant: Pick<ReputationGrant, "senderId" | "amount">;
        summary: { total: number; count: number };
        currentUserId: string;
      }>
    ) {
      const { conversationId, messageId, grant, summary, currentUserId } =
        action.payload;

      const messages = findLoadedMessages(state, conversationId, messageId);
      if (messages.length === 0) return;

      // The server only broadcasts positive grants, but the amount guard keeps
      // this honest if that ever changes.
      const viewerDelta =
        currentUserId && grant.senderId === currentUserId && grant.amount > 0
          ? grant.amount
          : 0;

      for (const message of messages) {
        const previousViewerTotal = message.grants?.viewerTotal ?? 0;
        message.grants = {
          total: summary.total,
          count: summary.count,
          viewerTotal: previousViewerTotal + viewerDelta,
        };
      }
    },

    // ── Thread actions ───────────────────────────────────────────────────────

    setThreadReplies(
      state,
      action: PayloadAction<{
        parentMessageId: string;
        messages: ChatMessage[];
        hasMore: boolean;
      }>
    ) {
      const { parentMessageId, messages, hasMore } = action.payload;
      state.threads[parentMessageId] = {
        items: messages,
        loading: false,
        hasMore,
        cursor: advanceCursor(null, messages),
      };
    },

    /**
     * Merge a fetched page of thread replies (oldest first) into the thread:
     * upserts each reply, advances the cursor past the page and records
     * whether the server has more. Merging rather than replacing keeps any
     * live reply that landed while the page was in flight.
     */
    mergeThreadReplies(
      state,
      action: PayloadAction<{
        parentMessageId: string;
        messages: ChatMessage[];
        hasMore: boolean;
      }>
    ) {
      const { parentMessageId, messages, hasMore } = action.payload;
      if (!state.threads[parentMessageId]) {
        state.threads[parentMessageId] = {
          items: [],
          loading: false,
          hasMore,
          cursor: null,
        };
      }
      const thread = state.threads[parentMessageId];
      for (const message of messages) upsertInto(thread.items, message);
      thread.cursor = advanceCursor(thread.cursor, messages);
      thread.hasMore = hasMore;
    },

    /**
     * Start loading a thread from its first reply (the fetch on open): marks it
     * loading and forgets the fetched run. A bucket kept from an earlier open
     * may hold a cursor that moved past replies missed while the thread was
     * closed; resetting before the fetch, not when it lands, keeps a reconnect
     * catch-up or a failed load from resuming after them. Loaded replies stay
     * on screen; the first page and `loadMore` refresh them.
     */
    startThreadLoad(state, action: PayloadAction<{ parentMessageId: string }>) {
      const { parentMessageId } = action.payload;
      const thread = state.threads[parentMessageId];
      state.threads[parentMessageId] = {
        items: thread?.items ?? [],
        loading: true,
        hasMore: true,
        cursor: null,
      };
    },

    setThreadLoading(
      state,
      action: PayloadAction<{ parentMessageId: string; loading: boolean }>
    ) {
      const { parentMessageId, loading } = action.payload;
      if (!state.threads[parentMessageId]) {
        state.threads[parentMessageId] = {
          items: [],
          loading,
          hasMore: true,
          cursor: null,
        };
      } else {
        state.threads[parentMessageId].loading = loading;
      }
    },

    // ── Typing indicator actions ─────────────────────────────────────────────

    /** Replace the full typing-user list for a conversation. */
    setTypingUsers(
      state,
      action: PayloadAction<{ conversationId: string; userIds: string[] }>
    ) {
      const { conversationId, userIds } = action.payload;
      state.typingUsers[conversationId] = userIds;
    },

    // ── Socket connection ────────────────────────────────────────────────────

    setSocketConnected(state, action: PayloadAction<boolean>) {
      state.socketConnected = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Every hand-rolled slice returns to its initial state on an account
    // change. RTK-Query's cache is handled separately by
    // `baseApi.util.resetApiState()`; this covers what that does not.
    builder.addCase(resetAccountScopedState, () => initialState);
  },
});

// ─── Action exports ──────────────────────────────────────────────────────────

export const {
  setConversation,
  setConversationLoading,
  setConversationList,
  setConversationListLoading,
  setConversationListHasMore,
  setConversationListCursor,
  upsertConversationPreview,
  insertConversationPreview,
  removeConversationPreview,
  incrementUnread,
  clearUnread,
  setUnreadSummary,
  setMessagesLoading,
  setMessagesHasMore,
  upsertMessage,
  addOptimisticMessage,
  failOptimisticMessage,
  removeMessage,
  updateReactions,
  patchMessage,
  updateGrants,
  setThreadReplies,
  mergeThreadReplies,
  startThreadLoad,
  setThreadLoading,
  setTypingUsers,
  setSocketConnected,
} = chatSlice.actions;

export default chatSlice.reducer;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectConversation =
  (conversationId: string) =>
  (state: { sublay: SublayState }) =>
    state.sublay.chat.conversations[conversationId]?.data ?? null;

export const selectConversationLoading =
  (conversationId: string) =>
  (state: { sublay: SublayState }) =>
    state.sublay.chat.conversations[conversationId]?.loading ?? false;

export const selectConversationList = (state: { sublay: SublayState }) =>
  state.sublay.chat.conversationList.items;

export const selectConversationListLoading = (state: {
  sublay: SublayState;
}) => state.sublay.chat.conversationList.loading;

export const selectConversationListHasMore = (state: {
  sublay: SublayState;
}) => state.sublay.chat.conversationList.hasMore;

export const selectConversationListCursor = (state: {
  sublay: SublayState;
}) => state.sublay.chat.conversationList.cursor;

export const selectMessages =
  (conversationId: string) =>
  (state: { sublay: SublayState }) =>
    state.sublay.chat.messages[conversationId]?.items ?? [];

export const selectMessagesLoading =
  (conversationId: string) =>
  (state: { sublay: SublayState }) =>
    state.sublay.chat.messages[conversationId]?.loading ?? false;

export const selectMessagesHasMore =
  (conversationId: string) =>
  (state: { sublay: SublayState }) =>
    state.sublay.chat.messages[conversationId]?.hasMore ?? true;

export const selectOldestMessageId =
  (conversationId: string) =>
  (state: { sublay: SublayState }) =>
    state.sublay.chat.messages[conversationId]?.oldestMessageId ?? null;

export const selectNewestMessageId =
  (conversationId: string) =>
  (state: { sublay: SublayState }) =>
    state.sublay.chat.messages[conversationId]?.newestMessageId ?? null;

export const selectThreadReplies =
  (parentMessageId: string) =>
  (state: { sublay: SublayState }) =>
    state.sublay.chat.threads[parentMessageId]?.items ?? [];

export const selectThreadLoading =
  (parentMessageId: string) =>
  (state: { sublay: SublayState }) =>
    state.sublay.chat.threads[parentMessageId]?.loading ?? false;

export const selectThreadHasMore =
  (parentMessageId: string) =>
  (state: { sublay: SublayState }) =>
    state.sublay.chat.threads[parentMessageId]?.hasMore ?? true;

export const selectThreadCursor =
  (parentMessageId: string) =>
  (state: { sublay: SublayState }) =>
    state.sublay.chat.threads[parentMessageId]?.cursor ?? null;

export const selectTypingUsers =
  (conversationId: string) =>
  (state: { sublay: SublayState }) =>
    state.sublay.chat.typingUsers[conversationId] ?? [];

export const selectSocketConnected = (state: { sublay: SublayState }) =>
  state.sublay.chat.socketConnected;

export const selectTotalUnreadCount = (state: { sublay: SublayState }) =>
  state.sublay.chat.totalUnreadCount;

export const selectUnreadConversationCount = (state: {
  sublay: SublayState;
}) => state.sublay.chat.unreadConversationCount;
