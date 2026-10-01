import { describe, it, expect, afterEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import {
  resetAxiosMocks,
  makeChatMessage,
  makeConversationMember,
  makeConversationPreview,
} from "../test-utils";
import {
  addOptimisticMessage,
  setConversationList,
  upsertMessage,
} from "../store/slices/chatSlice";
import { makeProvidersWrapper, createFakeSocket, type FakeSocket } from "./testHelpers";
import { ChatContext, type ChatContextValue } from "./chat-context";
import { ConversationProvider, useConversationContext } from "./conversation-context";
import { SublayContext, type SublayContextValues } from "./sublay-context";

afterEach(() => {
  resetAxiosMocks();
});

function emptyMessagesPage() {
  return { messages: [], hasMore: false, oldestCreatedAt: null, newestCreatedAt: null };
}

function emptyMembersPage() {
  return { data: [] };
}

describe("ConversationProvider", () => {
  it("loads messages and members on mount and exposes them, along with conversationId", async () => {
    const { Wrapper, axiosPrivate } = makeProvidersWrapper({
      beforeRender: ({ axiosPrivate }) => {
        axiosPrivate.mockResponse("get", emptyMessagesPage());
        axiosPrivate.mockResponse("get", emptyMembersPage());
      },
    });

    const { result } = renderHook(() => useConversationContext(), {
      wrapper: ({ children }) => (
        <Wrapper>
          <ConversationProvider conversationId="conversation-1">{children}</ConversationProvider>
        </Wrapper>
      ),
    });

    await waitFor(() => expect(result.current.messagesLoading).toBe(false));
    await waitFor(() => expect(result.current.membersLoading).toBe(false));

    expect(result.current.conversationId).toBe("conversation-1");
    expect(result.current.messages).toEqual([]);
    expect(result.current.members).toEqual([]);
    expect(typeof result.current.send).toBe("function");

    const calls = axiosPrivate.calls("get");
    expect(calls[0].url).toBe("/test-project/chat/conversations/conversation-1/messages");
    expect(calls[1].url).toBe("/test-project/chat/conversations/conversation-1/members");
  });

  it("sends a message via the exposed send action", async () => {
    const { Wrapper, store, axiosPrivate } = makeProvidersWrapper({
      beforeRender: ({ axiosPrivate }) => {
        axiosPrivate.mockResponse("get", emptyMessagesPage());
        axiosPrivate.mockResponse("get", emptyMembersPage());
      },
    });

    const { result } = renderHook(() => useConversationContext(), {
      wrapper: ({ children }) => (
        <Wrapper>
          <ConversationProvider conversationId="conversation-1">{children}</ConversationProvider>
        </Wrapper>
      ),
    });

    await waitFor(() => expect(result.current.messagesLoading).toBe(false));

    const confirmed = makeChatMessage({ id: "message-1", conversationId: "conversation-1" });
    axiosPrivate.mockResponse("post", confirmed);

    await act(async () => {
      await result.current.send!({ content: "hi" });
    });

    const postCall = axiosPrivate.calls("post")[0];
    expect(postCall.url).toBe("/test-project/chat/conversations/conversation-1/messages");
    expect(postCall.body).toMatchObject({ content: "hi" });
  });

  it("joins the socket room on mount and leaves it on unmount", async () => {
    const fakeSocket: FakeSocket = createFakeSocket();
    const registerActiveConversation = vi.fn();
    const unregisterActiveConversation = vi.fn();

    const { Wrapper } = makeProvidersWrapper({
      beforeRender: ({ axiosPrivate }) => {
        axiosPrivate.mockResponse("get", emptyMessagesPage());
        axiosPrivate.mockResponse("get", emptyMembersPage());
      },
    });

    const chatContextValue: ChatContextValue = {
      socket: fakeSocket as never,
      connected: true,
      registerActiveConversation,
      unregisterActiveConversation,
    };

    const { unmount } = renderHook(() => useConversationContext(), {
      wrapper: ({ children }) => (
        <Wrapper>
          <ChatContext.Provider value={chatContextValue}>
            <ConversationProvider conversationId="conversation-1">{children}</ConversationProvider>
          </ChatContext.Provider>
        </Wrapper>
      ),
    });

    await waitFor(() =>
      expect(fakeSocket.emit).toHaveBeenCalledWith("join:conversation", {
        conversationId: "conversation-1",
      }),
    );
    expect(registerActiveConversation).toHaveBeenCalledWith("conversation-1");

    unmount();

    expect(fakeSocket.emit).toHaveBeenCalledWith("leave:conversation", {
      conversationId: "conversation-1",
    });
    expect(unregisterActiveConversation).toHaveBeenCalledWith("conversation-1");
  });

  it("adds a member to the exposed list when member:joined fires", async () => {
    const fakeSocket: FakeSocket = createFakeSocket();

    const { Wrapper } = makeProvidersWrapper({
      beforeRender: ({ axiosPrivate }) => {
        axiosPrivate.mockResponse("get", emptyMessagesPage());
        axiosPrivate.mockResponse("get", emptyMembersPage());
      },
    });

    const chatContextValue: ChatContextValue = {
      socket: fakeSocket as never,
      connected: true,
      registerActiveConversation: () => {},
      unregisterActiveConversation: () => {},
    };

    const { result } = renderHook(() => useConversationContext(), {
      wrapper: ({ children }) => (
        <Wrapper>
          <ChatContext.Provider value={chatContextValue}>
            <ConversationProvider conversationId="conversation-1">{children}</ConversationProvider>
          </ChatContext.Provider>
        </Wrapper>
      ),
    });

    await waitFor(() => expect(result.current.membersLoading).toBe(false));

    const member = makeConversationMember({ userId: "user-2", conversationId: "conversation-1" });

    act(() => {
      fakeSocket.trigger("member:joined", { conversationId: "conversation-1", member });
    });

    await waitFor(() => expect(result.current.members).toEqual([member]));
  });

  describe("mark read", () => {
    const READ_URL = "/test-project/chat/conversations/conversation-1/read";

    function msg(id: string, createdAt: string) {
      return makeChatMessage({ id, conversationId: "conversation-1", createdAt });
    }

    // Server returns the main stream newest-first.
    function messagesPage(messages: ReturnType<typeof msg>[]) {
      return { messages, hasMore: false };
    }

    function connectedChatContext(fakeSocket: FakeSocket): ChatContextValue {
      return {
        socket: fakeSocket as never,
        connected: true,
        registerActiveConversation: () => {},
        unregisterActiveConversation: () => {},
      };
    }

    function readCalls(axiosPrivate: { calls: (m: "post") => { url: string; body?: unknown }[] }) {
      return axiosPrivate.calls("post").filter((c) => c.url === READ_URL);
    }

    function deferred<T>() {
      let resolve!: (value: T) => void;
      const promise = new Promise<T>((r) => (resolve = r));
      return { promise, resolve };
    }

    it("cold open: clears the badge at once and marks the newest message once the fetch lands, with the socket already connected", async () => {
      const fakeSocket = createFakeSocket();
      fakeSocket.connected = true;
      const messagesResponse = deferred<{ data: unknown }>();

      const { Wrapper, store, axiosPrivate } = makeProvidersWrapper({
        beforeRender: ({ axiosPrivate }) => {
          vi.mocked(axiosPrivate.instance.get).mockReturnValueOnce(
            messagesResponse.promise as never,
          );
          axiosPrivate.mockResponse("get", emptyMembersPage());
          axiosPrivate.mockResponse("post", { message: "Marked as read." });
        },
      });
      store.dispatch(
        setConversationList([makeConversationPreview({ id: "conversation-1", unreadCount: 3 })]),
      );

      const { result } = renderHook(() => useConversationContext(), {
        wrapper: ({ children }) => (
          <Wrapper>
            <ChatContext.Provider value={connectedChatContext(fakeSocket)}>
              <ConversationProvider conversationId="conversation-1">{children}</ConversationProvider>
            </ChatContext.Provider>
          </Wrapper>
        ),
      });

      // Badge cleared before any message is loaded.
      expect(store.getState().sublay.chat.conversationList.items[0].unreadCount).toBe(0);
      expect(readCalls(axiosPrivate)).toHaveLength(0);

      await act(async () => {
        messagesResponse.resolve({
          data: messagesPage([
            msg("message-2", "2024-01-01T00:00:02.000Z"),
            msg("message-1", "2024-01-01T00:00:01.000Z"),
          ]),
        });
      });

      await waitFor(() => expect(result.current.messagesLoading).toBe(false));
      await waitFor(() => expect(readCalls(axiosPrivate)).toHaveLength(1));
      expect(readCalls(axiosPrivate)[0].body).toEqual({ messageId: "message-2" });
    });

    it("warm open: marks the cached newest message without needing a socket", async () => {
      const { Wrapper, store, axiosPrivate } = makeProvidersWrapper({
        beforeRender: ({ axiosPrivate }) => {
          axiosPrivate.mockResponse("get", messagesPage([]));
          axiosPrivate.mockResponse("get", emptyMembersPage());
          axiosPrivate.mockResponse("post", { message: "Marked as read." });
        },
      });
      store.dispatch(upsertMessage(msg("message-1", "2024-01-01T00:00:01.000Z")));
      store.dispatch(upsertMessage(msg("message-2", "2024-01-01T00:00:02.000Z")));

      const { result } = renderHook(() => useConversationContext(), {
        wrapper: ({ children }) => (
          <Wrapper>
            <ConversationProvider conversationId="conversation-1">{children}</ConversationProvider>
          </Wrapper>
        ),
      });

      await waitFor(() => expect(result.current.messagesLoading).toBe(false));
      await waitFor(() => expect(readCalls(axiosPrivate)).toHaveLength(1));
      expect(readCalls(axiosPrivate)[0].body).toEqual({ messageId: "message-2" });
    });

    it("marks the newest message once the project becomes ready", async () => {
      const { Wrapper, store, axiosPrivate } = makeProvidersWrapper({
        beforeRender: ({ axiosPrivate }) => {
          axiosPrivate.mockResponse("get", messagesPage([]));
          axiosPrivate.mockResponse("get", emptyMembersPage());
          axiosPrivate.mockResponse("post", { message: "Marked as read." });
        },
      });
      store.dispatch(upsertMessage(msg("message-1", "2024-01-01T00:00:01.000Z")));

      let projectId: string | null = null;
      const { rerender } = renderHook(() => useConversationContext(), {
        wrapper: ({ children }) => (
          <Wrapper>
            <SublayContext.Provider value={{ projectId, project: null } as SublayContextValues}>
              <ConversationProvider conversationId="conversation-1">{children}</ConversationProvider>
            </SublayContext.Provider>
          </Wrapper>
        ),
      });

      expect(readCalls(axiosPrivate)).toHaveLength(0);

      projectId = "test-project";
      rerender();

      await waitFor(() => expect(readCalls(axiosPrivate)).toHaveLength(1));
      expect(readCalls(axiosPrivate)[0].body).toEqual({ messageId: "message-1" });
    });

    it("marks each new newest message, skips optimistic sends and older pages", async () => {
      const { Wrapper, store, axiosPrivate } = makeProvidersWrapper({
        beforeRender: ({ axiosPrivate }) => {
          axiosPrivate.mockResponse("get", messagesPage([msg("message-1", "2024-01-01T00:00:01.000Z")]));
          axiosPrivate.mockResponse("get", emptyMembersPage());
          axiosPrivate.mockResponse("post", { message: "Marked as read." });
          axiosPrivate.mockResponse("post", { message: "Marked as read." });
        },
      });

      const { result } = renderHook(() => useConversationContext(), {
        wrapper: ({ children }) => (
          <Wrapper>
            <ConversationProvider conversationId="conversation-1">{children}</ConversationProvider>
          </Wrapper>
        ),
      });

      await waitFor(() => expect(result.current.messagesLoading).toBe(false));
      await waitFor(() => expect(readCalls(axiosPrivate)).toHaveLength(1));

      // Optimistic send: temp id never becomes newestMessageId.
      act(() => {
        store.dispatch(
          addOptimisticMessage(
            makeChatMessage({
              id: "temp-abc",
              localId: "abc",
              conversationId: "conversation-1",
              createdAt: "2024-01-01T00:00:03.000Z",
            }),
          ),
        );
      });
      // An older page arriving doesn't change the newest message either.
      act(() => {
        store.dispatch(upsertMessage(msg("message-0", "2024-01-01T00:00:00.000Z")));
      });
      expect(readCalls(axiosPrivate)).toHaveLength(1);

      // A live message (ChatProvider upserts every message:created).
      act(() => {
        store.dispatch(upsertMessage(msg("message-2", "2024-01-01T00:00:02.000Z")));
      });
      await waitFor(() => expect(readCalls(axiosPrivate)).toHaveLength(2));
      expect(readCalls(axiosPrivate)[1].body).toEqual({ messageId: "message-2" });
    });

    it("marks messages fetched by reconnect catch-up", async () => {
      const fakeSocket = createFakeSocket();
      fakeSocket.connected = true;

      const { Wrapper, axiosPrivate } = makeProvidersWrapper({
        beforeRender: ({ axiosPrivate }) => {
          axiosPrivate.mockResponse("get", messagesPage([msg("message-1", "2024-01-01T00:00:01.000Z")]));
          axiosPrivate.mockResponse("get", emptyMembersPage());
          axiosPrivate.mockResponse("post", { message: "Marked as read." });
        },
      });

      const { result } = renderHook(() => useConversationContext(), {
        wrapper: ({ children }) => (
          <Wrapper>
            <ChatContext.Provider value={connectedChatContext(fakeSocket)}>
              <ConversationProvider conversationId="conversation-1">{children}</ConversationProvider>
            </ChatContext.Provider>
          </Wrapper>
        ),
      });

      await waitFor(() => expect(result.current.messagesLoading).toBe(false));
      await waitFor(() => expect(readCalls(axiosPrivate)).toHaveLength(1));

      // Catch-up returns ascending.
      axiosPrivate.mockResponse("get", {
        messages: [
          msg("message-2", "2024-01-01T00:00:02.000Z"),
          msg("message-3", "2024-01-01T00:00:03.000Z"),
        ],
      });
      axiosPrivate.mockResponse("post", { message: "Marked as read." });

      await act(async () => {
        fakeSocket.trigger("connect");
      });

      await waitFor(() => expect(readCalls(axiosPrivate)).toHaveLength(2));
      expect(readCalls(axiosPrivate)[1].body).toEqual({ messageId: "message-3" });
    });
  });
});
