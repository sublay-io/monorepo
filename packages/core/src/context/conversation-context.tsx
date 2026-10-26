import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useChatContext } from "./chat-context";
import { useSublayDispatch, useSublaySelector } from "../store/hooks";
import { selectNewestMessageId } from "../store/slices/chatSlice";
import useConversationData, {
  UseConversationDataValues,
} from "../hooks/chat/useConversationData";
import useMarkConversationAsRead from "../hooks/chat/useMarkConversationAsRead";
import useFetchManyChatMessages from "../hooks/chat/messages/useFetchManyChatMessages";
import useProject from "../hooks/projects/useProject";
import {
  clearUnread,
  setMessagesHasMore,
  upsertMessage,
} from "../store/slices/chatSlice";
import type { ChatMessage } from "../interfaces/models/ChatMessage";
import type { ConversationMember } from "../interfaces/models/ConversationMember";
import { handleError } from "../utils/handleError";

// ─── Context shape ────────────────────────────────────────────────────────────

export interface ConversationContextValue extends UseConversationDataValues {
  conversationId: string;
}

export const ConversationContext = createContext<
  Partial<ConversationContextValue>
>({});

export function useConversationContext(): Partial<ConversationContextValue> {
  return useContext(ConversationContext);
}

// ─── Provider ────────────────────────────────────────────────────────────────

export interface ConversationProviderProps {
  conversationId: string;
  /** Called when the conversation is deleted by an admin */
  onDeleted?: () => void;
  children: ReactNode;
}

export const ConversationProvider: React.FC<ConversationProviderProps> = ({
  conversationId,
  onDeleted,
  children,
}) => {
  const dispatch = useSublayDispatch();
  const { projectId } = useProject();
  const fetchMany = useFetchManyChatMessages();

  const { socket, registerActiveConversation, unregisterActiveConversation } =
    useChatContext();

  // The newest loaded message id drives the server read position (mark read).
  const newestMessageId = useSublaySelector(
    selectNewestMessageId(conversationId),
  );

  const mark = useMarkConversationAsRead({ conversationId });

  // Keep a ref to the messages state so socket handlers can find latest messages
  const messagesRef = useRef<ChatMessage[]>([]);
  const reduxMessages = useSublaySelector(
    (state: any) => state.sublay.chat.messages[conversationId]?.items ?? [],
  );
  useEffect(() => {
    messagesRef.current = reduxMessages;
  }, [reduxMessages]);

  // Fetch what arrived while the socket was down. With messages loaded, page
  // forward from the newest one until the server has no more, so a long
  // disconnect doesn't drop everything past the first page. With nothing to
  // anchor on (an empty conversation, or a first load that failed), load the
  // latest page the way the mount fetch does.
  //
  // `anchorAt` is the newest message loaded when the socket dropped. Paging
  // from the newest loaded *now* would skip what others sent while it was
  // down if you sent a message meanwhile (your send still confirms over REST).
  const catchUpMessages = useCallback(async (anchorAt: string | null) => {
    if (!projectId || !conversationId) return;

    try {
      if (!anchorAt) {
        const page = await fetchMany({ conversationId, sortDir: "desc" });
        // Newest first from the server; the store keeps messages ascending.
        [...page.messages].reverse().forEach((msg) => dispatch(upsertMessage(msg)));
        dispatch(setMessagesHasMore({ conversationId, hasMore: page.hasMore }));
        return;
      }

      let after = new Date(anchorAt).toISOString();
      while (true) {
        const page = await fetchMany({
          conversationId,
          after,
          limit: 100,
          sortDir: "asc",
        });
        page.messages.forEach((msg) => dispatch(upsertMessage(msg)));
        // Stop when the server is done, or if the cursor didn't move.
        if (!page.hasMore || !page.newestCreatedAt || page.newestCreatedAt === after) {
          break;
        }
        after = page.newestCreatedAt;
      }
    } catch (err) {
      handleError(err, "Failed to fetch missed messages");
    }
  }, [projectId, conversationId, fetchMany, dispatch]);

  // ── Conversation data (messages, send, members, etc.) ─────────────────────
  // Called before the socket effects so upsertMember / removeMemberLocally are
  // available as stable callbacks in the member event handlers below.
  const data = useConversationData({ conversationId });

  // ── Room join / leave ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !conversationId) return;

    const room = conversationId;

    // Register this conversation as active (suppresses unread increments in ChatProvider)
    registerActiveConversation(room);

    // Join the Socket.io room
    socket.emit("join:conversation", { conversationId });

    return () => {
      socket.emit("leave:conversation", { conversationId });
      unregisterActiveConversation(room);
    };
  }, [
    socket,
    conversationId,
    registerActiveConversation,
    unregisterActiveConversation,
  ]);

  // ── Mark read ──────────────────────────────────────────────────────────────
  // Opening the conversation clears its unread badge immediately, without
  // waiting for messages to load or the socket to connect.
  useEffect(() => {
    if (!conversationId) return;
    dispatch(clearUnread(conversationId));
  }, [conversationId, dispatch]);

  // The server read position follows the newest loaded message. One rule covers
  // the initial fetch (cold or cached), live messages, confirmed sends and
  // reconnect catch-up. newestMessageId never points at an optimistic `temp-`
  // message, and loading older pages doesn't change it. Wait for projectId so
  // a no-op mark isn't recorded as sent.
  const lastMarkedRef = useRef<{ conversationId: string; messageId: string } | null>(null);
  useEffect(() => {
    if (!projectId || !conversationId || !newestMessageId) return;
    const last = lastMarkedRef.current;
    if (last?.conversationId === conversationId && last.messageId === newestMessageId) {
      return;
    }
    lastMarkedRef.current = { conversationId, messageId: newestMessageId };
    mark({ messageId: newestMessageId });
  }, [projectId, conversationId, newestMessageId, mark]);

  // ── Reconnect handler ──────────────────────────────────────────────────────
  // On reconnects (not the initial connect), re-join the room and catch up on
  // messages that arrived during the disconnection window.
  useEffect(() => {
    if (!socket || !conversationId) return;

    // Track whether the initial connect has been observed so we can distinguish
    // it from subsequent reconnects (socket.on("connect") fires on both).
    const hasConnectedOnceRef = { current: socket.connected };

    // The newest real message when the socket dropped (`undefined`: no drop
    // seen, e.g. mounted while already disconnected).
    const newestLoadedAt = (): string | null => {
      for (let i = messagesRef.current.length - 1; i >= 0; i--) {
        // Optimistic `temp-` messages have no server timestamp to page from.
        if (!messagesRef.current[i].id.startsWith("temp-")) {
          return messagesRef.current[i].createdAt;
        }
      }
      return null;
    };
    let anchorAtDisconnect: string | null | undefined;

    const handleDisconnect = () => {
      anchorAtDisconnect = newestLoadedAt();
    };

    const handleConnect = async () => {
      if (!hasConnectedOnceRef.current) {
        // Initial connect — the mount effect already joined the room.
        hasConnectedOnceRef.current = true;
        return;
      }

      // True reconnect: re-join the room and catch up on missed messages.
      socket.emit("join:conversation", { conversationId });
      const anchorAt =
        anchorAtDisconnect !== undefined ? anchorAtDisconnect : newestLoadedAt();
      anchorAtDisconnect = undefined;
      await catchUpMessages(anchorAt);
    };

    socket.on("disconnect", handleDisconnect);
    socket.on("connect", handleConnect);
    return () => {
      socket.off("disconnect", handleDisconnect);
      socket.off("connect", handleConnect);
    };
  }, [socket, conversationId, catchUpMessages]);

  // ── conversation:deleted ───────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleDeleted = ({
      conversationId: deletedId,
    }: {
      conversationId: string;
    }) => {
      if (deletedId !== conversationId) return;
      socket.emit("leave:conversation", { conversationId });
      unregisterActiveConversation(conversationId);
      onDeleted?.();
    };

    socket.on("conversation:deleted", handleDeleted);
    return () => {
      socket.off("conversation:deleted", handleDeleted);
    };
  }, [socket, conversationId, unregisterActiveConversation, onDeleted]);

  // ── Member join / leave ────────────────────────────────────────────────────
  // Update local members state when the server broadcasts member changes.
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleMemberJoined = (payload: {
      conversationId: string;
      member: ConversationMember;
    }) => {
      if (payload.conversationId !== conversationId) return;
      data.upsertMember(payload.member);
    };

    const handleMemberLeft = (payload: {
      conversationId: string;
      userId: string;
    }) => {
      if (payload.conversationId !== conversationId) return;
      data.removeMemberLocally({ userId: payload.userId });
    };

    socket.on("member:joined", handleMemberJoined);
    socket.on("member:left", handleMemberLeft);
    return () => {
      socket.off("member:joined", handleMemberJoined);
      socket.off("member:left", handleMemberLeft);
    };
  }, [socket, conversationId, data.upsertMember, data.removeMemberLocally]);

  return (
    <ConversationContext.Provider value={{ ...data, conversationId }}>
      {children}
    </ConversationContext.Provider>
  );
};
