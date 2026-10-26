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
    // The confirmed message becomes the newest one and is marked read.
    axiosPrivate.mockResponse("post", { message: "Marked as read." });

    await act(async () => {
      await result.current.send!({ content: "hi" });
    });

    const postCall = axiosPrivate.calls("post")[0];
    expect(postCall.url).toBe("/test-project/chat/conversations/conversation-1/messages");
    expect(postCall.body).toMatchObject({ content: "hi" });
    await waitFor(() =>
      expect(axiosPrivate.calls("post")[1]?.url).toBe(
        "/test-project/chat/conversations/conversation-1/read",
      ),
    );
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

  describe("reconnect catch-up", () => {
    const MESSAGES_URL = "/test-project/chat/conversations/conversation-1/messages";

    function msg(id: string, createdAt: string) {
      return makeChatMessage({ id, conversationId: "conversation-1", createdAt });
    }

    function page(messages: ReturnType<typeof msg>[], hasMore = false) {
      const times = messages.map((m) => m.createdAt).sort();
      return {
        messages,
        hasMore,
        oldestCreatedAt: times[0] ?? null,
        newestCreatedAt: times[times.length - 1] ?? null,
      };
    }

    // Mount fetches messages, then members; every newest message is marked
    // read. Unmocked calls reach real axios, so mock the marks generously.
    function renderConversation(fakeSocket: FakeSocket, mountPage: ReturnType<typeof page>) {
      const harness = makeProvidersWrapper({
        beforeRender: ({ axiosPrivate }) => {
          axiosPrivate.mockResponse("get", mountPage);
          axiosPrivate.mockResponse("get", emptyMembersPage());
          for (let i = 0; i < 5; i++) {
            axiosPrivate.mockResponse("post", { message: "Marked as read." });
          }
        },
      });
      const chatContextValue: ChatContextValue = {
        socket: fakeSocket as never,
        connected: fakeSocket.connected,
        registerActiveConversation: () => {},
        unregisterActiveConversation: () => {},
      };
      const { result } = renderHook(() => useConversationContext(), {
        wrapper: ({ children }) => (
          <harness.Wrapper>
            <ChatContext.Provider value={chatContextValue}>
              <ConversationProvider conversationId="conversation-1">{children}</ConversationProvider>
            </ChatContext.Provider>
          </harness.Wrapper>
        ),
      });
      return { ...harness, result };
    }

    // Wait for the read mark of the final newest message, so it isn't sent
    // after the mocks are reset and doesn't reach real axios.
    async function waitForMarked(
      axiosPrivate: { calls: (m: "post") => { url: string; body?: unknown }[] },
      messageId: string,
    ) {
      await waitFor(() => {
        const marks = axiosPrivate
          .calls("post")
          .filter((c) => c.url === "/test-project/chat/conversations/conversation-1/read");
        expect(marks[marks.length - 1]?.body).toEqual({ messageId });
      });
    }

    // The two mount GETs come first; catch-up requests follow them.
    function catchUpCalls(axiosPrivate: { calls: (m: "get") => { url: string; config?: any }[] }) {
      return axiosPrivate.calls("get").slice(2);
    }

    it("does not fetch on the initial connect", async () => {
      const fakeSocket = createFakeSocket();
      const { result, axiosPrivate } = renderConversation(
        fakeSocket,
        page([msg("message-1", "2024-01-01T00:00:01.000Z")]),
      );
      await waitFor(() => expect(result.current.messagesLoading).toBe(false));

      await act(async () => {
        fakeSocket.trigger("connect");
      });

      expect(catchUpCalls(axiosPrivate)).toHaveLength(0);
      await waitForMarked(axiosPrivate, "message-1");
    });

    it("re-joins the room and fetches the messages after the newest loaded one", async () => {
      const fakeSocket = createFakeSocket();
      fakeSocket.connected = true;
      const { result, axiosPrivate } = renderConversation(
        fakeSocket,
        page([msg("message-1", "2024-01-01T00:00:01.000Z")]),
      );
      await waitFor(() => expect(result.current.messagesLoading).toBe(false));
      fakeSocket.emit.mockClear();

      axiosPrivate.mockResponse(
        "get",
        page([
          msg("message-2", "2024-01-01T00:00:02.000Z"),
          msg("message-3", "2024-01-01T00:00:03.000Z"),
        ]),
      );
      await act(async () => {
        fakeSocket.trigger("connect");
      });

      await waitFor(() =>
        expect(result.current.messages!.map((m) => m.id)).toEqual([
          "message-1",
          "message-2",
          "message-3",
        ]),
      );
      expect(fakeSocket.emit).toHaveBeenCalledWith("join:conversation", {
        conversationId: "conversation-1",
      });
      const calls = catchUpCalls(axiosPrivate);
      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(MESSAGES_URL);
      expect(calls[0].config.params).toEqual({
        after: "2024-01-01T00:00:01.000Z",
        limit: 100,
        sortDir: "asc",
      });
      await waitForMarked(axiosPrivate, "message-3");
    });

    it("keeps fetching pages until the server has no more", async () => {
      const fakeSocket = createFakeSocket();
      fakeSocket.connected = true;
      const { result, axiosPrivate } = renderConversation(
        fakeSocket,
        page([msg("message-1", "2024-01-01T00:00:01.000Z")]),
      );
      await waitFor(() => expect(result.current.messagesLoading).toBe(false));

      axiosPrivate.mockResponse(
        "get",
        page(
          [
            msg("message-2", "2024-01-01T00:00:02.000Z"),
            msg("message-3", "2024-01-01T00:00:03.000Z"),
          ],
          true,
        ),
      );
      axiosPrivate.mockResponse("get", page([msg("message-4", "2024-01-01T00:00:04.000Z")]));
      await act(async () => {
        fakeSocket.trigger("connect");
      });

      await waitFor(() =>
        expect(result.current.messages!.map((m) => m.id)).toEqual([
          "message-1",
          "message-2",
          "message-3",
          "message-4",
        ]),
      );
      const calls = catchUpCalls(axiosPrivate);
      expect(calls).toHaveLength(2);
      expect(calls[1].url).toBe(MESSAGES_URL);
      expect(calls[1].config.params.after).toBe("2024-01-01T00:00:03.000Z");
      await waitForMarked(axiosPrivate, "message-4");
    });

    it("pages from the newest message loaded when the socket dropped, not from one sent while it was down", async () => {
      const fakeSocket = createFakeSocket();
      fakeSocket.connected = true;
      const { result, store, axiosPrivate } = renderConversation(
        fakeSocket,
        page([msg("message-1", "2024-01-01T00:00:01.000Z")]),
      );
      await waitFor(() => expect(result.current.messagesLoading).toBe(false));
      await waitForMarked(axiosPrivate, "message-1");

      act(() => {
        fakeSocket.trigger("disconnect");
      });
      // Your own send confirms over REST while the socket is down.
      act(() => {
        store.dispatch(upsertMessage(msg("message-5", "2024-01-01T00:00:05.000Z")));
      });
      await waitForMarked(axiosPrivate, "message-5");

      axiosPrivate.mockResponse(
        "get",
        page([
          msg("message-2", "2024-01-01T00:00:02.000Z"),
          msg("message-5", "2024-01-01T00:00:05.000Z"),
        ]),
      );
      await act(async () => {
        fakeSocket.trigger("connect");
      });

      await waitFor(() =>
        expect(result.current.messages!.map((m) => m.id)).toEqual(["message-1", "message-2", "message-5"]),
      );
      const calls = catchUpCalls(axiosPrivate);
      expect(calls).toHaveLength(1);
      expect(calls[0].config.params.after).toBe("2024-01-01T00:00:01.000Z");
    });

    it("loads the latest page when no message is loaded to page from", async () => {
      const fakeSocket = createFakeSocket();
      fakeSocket.connected = true;
      const { result, axiosPrivate } = renderConversation(fakeSocket, page([]));
      await waitFor(() => expect(result.current.messagesLoading).toBe(false));

      // Newest first, like the mount fetch; older history still to load.
      axiosPrivate.mockResponse(
        "get",
        page(
          [
            msg("message-2", "2024-01-01T00:00:02.000Z"),
            msg("message-1", "2024-01-01T00:00:01.000Z"),
          ],
          true,
        ),
      );
      await act(async () => {
        fakeSocket.trigger("connect");
      });

      await waitFor(() =>
        expect(result.current.messages!.map((m) => m.id)).toEqual(["message-1", "message-2"]),
      );
      expect(result.current.hasMore).toBe(true);
      const calls = catchUpCalls(axiosPrivate);
      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(MESSAGES_URL);
      expect(calls[0].config.params).toEqual({ limit: 50, sortDir: "desc" });
      await waitForMarked(axiosPrivate, "message-2");
    });
  });
});
