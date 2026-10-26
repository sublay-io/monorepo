import { describe, it, expect, afterEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { resetAxiosMocks, makeChatMessage } from "../test-utils";
import { makeProvidersWrapper, createFakeSocket, type FakeSocket } from "./testHelpers";
import { ChatContext, type ChatContextValue } from "./chat-context";
import { MessageThreadProvider, useMessageThreadContext } from "./message-thread-context";

afterEach(() => {
  resetAxiosMocks();
});

describe("MessageThreadProvider", () => {
  it("exposes the message thread's replies and messageId to consumers", async () => {
    const reply = makeChatMessage({ id: "reply-1", parentMessageId: "message-1" });

    const { Wrapper, axiosPrivate } = makeProvidersWrapper({
      beforeRender: ({ axiosPrivate }) =>
        axiosPrivate.mockResponse("get", {
          messages: [reply],
          hasMore: false,
          oldestCreatedAt: reply.createdAt,
          newestCreatedAt: reply.createdAt,
        }),
    });

    const { result } = renderHook(() => useMessageThreadContext(), {
      wrapper: ({ children }) => (
        <Wrapper>
          <MessageThreadProvider conversationId="conversation-1" messageId="message-1">
            {children}
          </MessageThreadProvider>
        </Wrapper>
      ),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.replies).toEqual([reply]);
    expect(result.current.messageId).toBe("message-1");

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/chat/conversations/conversation-1/messages");
    expect(call.config?.params).toMatchObject({ parentMessageId: "message-1" });
  });

  it("sendReply attaches the thread's messageId as parentMessageId", async () => {
    const { Wrapper, axiosPrivate } = makeProvidersWrapper({
      beforeRender: ({ axiosPrivate }) =>
        axiosPrivate.mockResponse("get", {
          messages: [],
          hasMore: false,
          oldestCreatedAt: null,
          newestCreatedAt: null,
        }),
    });

    const { result } = renderHook(() => useMessageThreadContext(), {
      wrapper: ({ children }) => (
        <Wrapper>
          <MessageThreadProvider conversationId="conversation-1" messageId="message-1">
            {children}
          </MessageThreadProvider>
        </Wrapper>
      ),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // The server echoes the request's localId, which swaps out the optimistic copy.
    vi.mocked(axiosPrivate.instance.post).mockImplementationOnce(async (_url, body) => ({
      data: makeChatMessage({
        id: "reply-1",
        parentMessageId: "message-1",
        localId: (body as { localId: string }).localId,
      }),
    }) as never);

    await act(async () => {
      await result.current.sendReply!({ content: "a reply" });
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.body).toMatchObject({ content: "a reply", parentMessageId: "message-1" });
    // The confirmed reply shows in the thread.
    expect(result.current.replies!.map((r) => r.id)).toEqual(["reply-1"]);
  });

  describe("reconnect catch-up", () => {
    const MESSAGES_URL = "/test-project/chat/conversations/conversation-1/messages";

    function reply(id: string, createdAt: string) {
      return makeChatMessage({
        id,
        conversationId: "conversation-1",
        parentMessageId: "message-1",
        createdAt,
      });
    }

    function page(replies: ReturnType<typeof reply>[], hasMore = false) {
      const times = replies.map((r) => r.createdAt).sort();
      return {
        messages: replies,
        hasMore,
        oldestCreatedAt: times[0] ?? null,
        newestCreatedAt: times[times.length - 1] ?? null,
      };
    }

    function renderThread(fakeSocket: FakeSocket, mountPage: ReturnType<typeof page>) {
      const harness = makeProvidersWrapper({
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", mountPage),
      });
      const chatContextValue: ChatContextValue = {
        socket: fakeSocket as never,
        connected: fakeSocket.connected,
        registerActiveConversation: () => {},
        unregisterActiveConversation: () => {},
      };
      const { result } = renderHook(() => useMessageThreadContext(), {
        wrapper: ({ children }) => (
          <harness.Wrapper>
            <ChatContext.Provider value={chatContextValue}>
              <MessageThreadProvider conversationId="conversation-1" messageId="message-1">
                {children}
              </MessageThreadProvider>
            </ChatContext.Provider>
          </harness.Wrapper>
        ),
      });
      return { ...harness, result };
    }

    // The mount GET comes first; catch-up requests follow it.
    function catchUpCalls(axiosPrivate: { calls: (m: "get") => { url: string; config?: any }[] }) {
      return axiosPrivate.calls("get").slice(1);
    }

    it("does not fetch on the initial connect", async () => {
      const fakeSocket = createFakeSocket();
      const { result, axiosPrivate } = renderThread(
        fakeSocket,
        page([reply("reply-1", "2024-01-01T00:00:01.000Z")]),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        fakeSocket.trigger("connect");
      });

      expect(catchUpCalls(axiosPrivate)).toHaveLength(0);
    });

    it("pages forward from the newest fetched reply until the server has no more", async () => {
      const fakeSocket = createFakeSocket();
      fakeSocket.connected = true;
      const { result, axiosPrivate } = renderThread(
        fakeSocket,
        page([reply("reply-1", "2024-01-01T00:00:01.000Z")]),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      axiosPrivate.mockResponse(
        "get",
        page(
          [reply("reply-2", "2024-01-01T00:00:02.000Z"), reply("reply-3", "2024-01-01T00:00:03.000Z")],
          true,
        ),
      );
      axiosPrivate.mockResponse("get", page([reply("reply-4", "2024-01-01T00:00:04.000Z")]));
      await act(async () => {
        fakeSocket.trigger("connect");
      });

      await waitFor(() =>
        expect(result.current.replies!.map((r) => r.id)).toEqual([
          "reply-1",
          "reply-2",
          "reply-3",
          "reply-4",
        ]),
      );
      const calls = catchUpCalls(axiosPrivate);
      expect(calls).toHaveLength(2);
      expect(calls[0].url).toBe(MESSAGES_URL);
      expect(calls[0].config.params).toEqual({
        parentMessageId: "message-1",
        after: "2024-01-01T00:00:01.000Z",
        limit: 100,
        sortDir: "asc",
      });
      expect(calls[1].config.params.after).toBe("2024-01-01T00:00:03.000Z");
      expect(result.current.hasMore).toBe(false);
    });

    it("fetches from the start of the thread when no reply was loaded", async () => {
      const fakeSocket = createFakeSocket();
      fakeSocket.connected = true;
      const { result, axiosPrivate } = renderThread(fakeSocket, page([]));
      await waitFor(() => expect(result.current.loading).toBe(false));

      axiosPrivate.mockResponse("get", page([reply("reply-1", "2024-01-01T00:00:01.000Z")]));
      await act(async () => {
        fakeSocket.trigger("connect");
      });

      await waitFor(() => expect(result.current.replies!.map((r) => r.id)).toEqual(["reply-1"]));
      const calls = catchUpCalls(axiosPrivate);
      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(MESSAGES_URL);
      expect(calls[0].config.params).toEqual({
        parentMessageId: "message-1",
        limit: 100,
        sortDir: "asc",
      });
    });

    it("leaves a thread that isn't loaded to its end to loadMore", async () => {
      const fakeSocket = createFakeSocket();
      fakeSocket.connected = true;
      const { result, axiosPrivate } = renderThread(
        fakeSocket,
        page([reply("reply-1", "2024-01-01T00:00:01.000Z")], true),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        fakeSocket.trigger("connect");
      });

      expect(catchUpCalls(axiosPrivate)).toHaveLength(0);
    });
  });
});
