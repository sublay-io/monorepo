import { ChatMessage } from "../../../interfaces/models/ChatMessage";
import useLiveChatMessages from "./useLiveChatMessages";
import useSendMessage, {
  SendMessageParams,
  SendMessageResult,
} from "./useSendMessage";

export interface UseMessageThreadProps {
  conversationId: string;
  /** The message whose thread replies to load and send. */
  parentMessageId: string;
}

export interface UseMessageThreadValues {
  replies: ChatMessage[];
  loading: boolean;
  /** The last load failure. Cleared when the next load starts; `loadMore()` retries it. */
  error: Error | null;
  /** Whether `loadMore()` has anything to fetch: newer replies, or a load that failed. */
  hasMore: boolean;
  /**
   * Load the next replies in reading order (newer ones), or retry the load
   * that failed. Never rejects.
   */
  loadMore: () => Promise<void>;
  /** Reload the thread from its first reply. Never rejects. */
  refetch: () => Promise<void>;
  sendReply: (
    params: Omit<SendMessageParams, "parentMessageId">
  ) => Promise<SendMessageResult>;
}

function useMessageThread({
  conversationId,
  parentMessageId,
}: UseMessageThreadProps): UseMessageThreadValues {
  const { messages, loading, error, hasMore, loadMore, refetch } = useLiveChatMessages({
    conversationId,
    parentMessageId,
  });

  const send = useSendMessage({ conversationId });

  const sendReply = (params: Omit<SendMessageParams, "parentMessageId">) =>
    send({ ...params, parentMessageId });

  return {
    replies: messages,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
    sendReply,
  };
}

export default useMessageThread;
