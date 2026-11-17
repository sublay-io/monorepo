import React, { createContext, ReactNode, useContext } from "react";
import useMessageThread, {
  UseMessageThreadValues,
} from "../hooks/chat/messages/useMessageThread";

// ─── Context shape ────────────────────────────────────────────────────────────

export interface MessageThreadContextValue extends UseMessageThreadValues {
  parentMessageId: string;
}

export const MessageThreadContext = createContext<
  Partial<MessageThreadContextValue>
>({});

export function useMessageThreadContext(): Partial<MessageThreadContextValue> {
  return useContext(MessageThreadContext);
}

// ─── Provider ────────────────────────────────────────────────────────────────

export interface MessageThreadProviderProps {
  parentMessageId: string;
  conversationId: string;
  children: ReactNode;
}

export const MessageThreadProvider: React.FC<MessageThreadProviderProps> = ({
  parentMessageId,
  conversationId,
  children,
}) => {
  const data = useMessageThread({ parentMessageId, conversationId });

  return (
    <MessageThreadContext.Provider value={{ ...data, parentMessageId }}>
      {children}
    </MessageThreadContext.Provider>
  );
};
