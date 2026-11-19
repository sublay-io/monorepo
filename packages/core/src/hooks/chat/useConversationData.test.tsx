import { describe, it, expect, afterEach } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeChatMessage, makeConversationMember } from "../../test-utils";
import useConversationData from "./useConversationData";

afterEach(() => {
  resetAxiosMocks();
});

describe("useConversationData", () => {
  it("fetches messages and members on mount", async () => {
    const message = makeChatMessage();
    const member = makeConversationMember();

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversationData({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) => {
          axiosPrivate.mockResponse("get", { data: [message], pagination: { hasMore: false } });
          axiosPrivate.mockResponse("get", { data: [member] });
        },
      },
    );

    await waitFor(() => expect(result.current.messages).toEqual([message]));
    await waitFor(() => expect(result.current.members).toEqual([member]));
    expect(result.current.messagesLoading).toBe(false);
    expect(result.current.membersLoading).toBe(false);

    const calls = axiosPrivate.calls("get");
    expect(calls[0].url).toBe("/test-project/chat/conversations/conversation-1/messages");
    expect(calls[1].url).toBe("/test-project/chat/conversations/conversation-1/members");
  });

  it("sends a message via send()", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversationData({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) => {
          axiosPrivate.mockResponse("get", { data: [], pagination: { hasMore: false } });
          axiosPrivate.mockResponse("get", { data: [] });
        },
      },
    );
    await waitFor(() => expect(result.current.messagesLoading).toBe(false));

    const sent = makeChatMessage({ content: "hi" });
    axiosPrivate.mockResponse("post", sent);

    let returned;
    await act(async () => {
      returned = await result.current.send({ content: "hi" });
    });

    expect(returned).toEqual(sent);
    const sendCall = axiosPrivate.calls("post")[0];
    expect(sendCall.url).toBe("/test-project/chat/conversations/conversation-1/messages");
  });

  it("marks a message as read via mark()", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversationData({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) => {
          axiosPrivate.mockResponse("get", { data: [], pagination: { hasMore: false } });
          axiosPrivate.mockResponse("get", { data: [] });
        },
      },
    );
    await waitFor(() => expect(result.current.messagesLoading).toBe(false));

    axiosPrivate.mockResponse("post", {});

    await act(async () => {
      await result.current.mark({ messageId: "message-1" });
    });

    const markCall = axiosPrivate.calls("post")[0];
    expect(markCall.url).toBe("/test-project/chat/conversations/conversation-1/read");
  });

  it("exposes typing controls that no-op without a socket", async () => {
    const { result } = renderHookWithAxios(
      () => useConversationData({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) => {
          axiosPrivate.mockResponse("get", { data: [], pagination: { hasMore: false } });
          axiosPrivate.mockResponse("get", { data: [] });
        },
      },
    );
    await waitFor(() => expect(result.current.messagesLoading).toBe(false));

    expect(result.current.typingUsers).toEqual([]);
    expect(() => result.current.startTyping()).not.toThrow();
    expect(() => result.current.stopTyping()).not.toThrow();
  });
});
