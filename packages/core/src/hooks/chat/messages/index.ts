// Live, store-backed conversation view
export { default as useLiveChatMessages } from "./useLiveChatMessages";
export type {
  UseLiveChatMessagesProps,
  UseLiveChatMessagesValues,
} from "./useLiveChatMessages";

// Deprecated alias — use useLiveChatMessages
export { default as useChatMessages } from "./useChatMessages";
export type { UseChatMessagesProps, UseChatMessagesValues } from "./useChatMessages";

// Stateless / query message fetchers
export { default as useFetchManyChatMessages } from "./useFetchManyChatMessages";
export type {
  FetchManyChatMessagesProps,
  FetchManyChatMessagesResponse,
  MessageFilters,
} from "./useFetchManyChatMessages";

export { default as useFetchManyChatMessagesWrapper } from "./useFetchManyChatMessagesWrapper";
export type {
  UseFetchManyChatMessagesWrapperProps,
  UseFetchManyChatMessagesWrapperValues,
} from "./useFetchManyChatMessagesWrapper";

export { default as useSendMessage } from "./useSendMessage";
export type {
  SendMessageParams,
  SendMessageResult,
  UseSendMessageProps,
} from "./useSendMessage";

export { default as useEditMessage } from "./useEditMessage";
export type { EditMessageParams } from "./useEditMessage";

export { default as useDeleteMessage } from "./useDeleteMessage";
export type { DeleteMessageParams } from "./useDeleteMessage";

export { default as useToggleReaction } from "./useToggleReaction";
export type {
  ToggleReactionParams,
  ToggleReactionResult,
} from "./useToggleReaction";

export { default as useMessageThread } from "./useMessageThread";
export type {
  UseMessageThreadProps,
  UseMessageThreadValues,
} from "./useMessageThread";
