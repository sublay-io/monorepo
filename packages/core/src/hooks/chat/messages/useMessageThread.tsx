import { ChatMessage } from "../../../interfaces/models/ChatMessage";
import useLiveChatMessages from "./useLiveChatMessages";
import useSendMessage, { SendMessageParams } from "./useSendMessage";

export interface UseMessageThreadProps {
  conversationId: string;
  messageId: string;
}

export interface UseMessageThreadValues {
  replies: ChatMessage[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  sendReply: (params: Omit<SendMessageParams, "parentMessageId">) => Promise<ChatMessage>;
}

function useMessageThread({
  conversationId,
  messageId,
}: UseMessageThreadProps): UseMessageThreadValues {
  const { messages, loading, hasMore, loadOlder } = useLiveChatMessages({
    conversationId,
    parentMessageId: messageId,
  });

  const send = useSendMessage({ conversationId });

  const sendReply = (params: Omit<SendMessageParams, "parentMessageId">) =>
    send({ ...params, parentMessageId: messageId });

  return {
    replies: messages,
    loading,
    hasMore,
    loadMore: loadOlder,
    sendReply,
  };
}

export default useMessageThread;
