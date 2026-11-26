import useLiveChatMessages from "./messages/useLiveChatMessages";
import useSendMessage from "./messages/useSendMessage";
import {
  SendMessageParams,
  SendMessageResult,
} from "./messages/useSendMessage";
import useConversationMembers, {
  UseConversationMembersValues,
} from "./conversations/useConversationMembers";
import useMarkConversationAsRead from "./useMarkConversationAsRead";
import useTypingIndicator from "./useTypingIndicator";
import { ChatMessage } from "../../interfaces/models/ChatMessage";

export interface UseConversationDataProps {
  conversationId: string;
}

export interface UseConversationDataValues {
  // Messages
  messages: ChatMessage[];
  messagesLoading: boolean;
  /** The last failure loading messages. Cleared when the next load starts; `loadMore()` retries it. */
  messagesError: Error | null;
  /** Whether `loadMore()` has anything to fetch: older messages, or a load that failed. */
  hasMore: boolean;
  /**
   * Load the next messages in reading order (older ones), or retry the load
   * that failed. Never rejects.
   */
  loadMore: () => Promise<void>;
  /** Reload the latest messages, replacing the ones loaded. Never rejects. */
  refetchMessages: () => Promise<void>;

  // Send
  send: (params: SendMessageParams) => Promise<SendMessageResult>;

  // Members
  members: UseConversationMembersValues["members"];
  membersLoading: UseConversationMembersValues["loading"];
  addMember: UseConversationMembersValues["addMember"];
  removeMember: UseConversationMembersValues["removeMember"];
  leave: UseConversationMembersValues["leave"];
  changeRole: UseConversationMembersValues["changeRole"];
  upsertMember: UseConversationMembersValues["upsertMember"];
  removeMemberLocally: UseConversationMembersValues["removeMemberLocally"];

  // Read state
  mark: ({ messageId }: { messageId: string }) => Promise<void>;

  // Typing
  typingUsers: string[];
  startTyping: () => void;
  stopTyping: () => void;
}

/**
 * High-level composition hook that powers ConversationProvider.
 * Combines messages, send, members, read-state, and typing indicators into one object.
 */
function useConversationData({
  conversationId,
}: UseConversationDataProps): UseConversationDataValues {
  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    hasMore,
    loadMore,
    refetch: refetchMessages,
  } = useLiveChatMessages({
    conversationId,
  });

  const send = useSendMessage({ conversationId });

  const {
    members,
    loading: membersLoading,
    addMember,
    removeMember,
    leave,
    changeRole,
    upsertMember,
    removeMemberLocally,
  } = useConversationMembers({ conversationId });

  const mark = useMarkConversationAsRead({ conversationId });

  const { typingUsers, startTyping, stopTyping } = useTypingIndicator({
    conversationId,
  });

  return {
    messages,
    messagesLoading,
    messagesError,
    hasMore,
    loadMore,
    refetchMessages,
    send,
    members,
    membersLoading,
    addMember,
    removeMember,
    leave,
    changeRole,
    upsertMember,
    removeMemberLocally,
    mark,
    typingUsers,
    startTyping,
    stopTyping,
  };
}

export default useConversationData;
