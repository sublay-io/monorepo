import { describe, it, expect, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { resetAxiosMocks, makeChatMessage } from "../test-utils";
import { makeProvidersWrapper } from "./testHelpers";
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

    axiosPrivate.mockResponse(
      "post",
      makeChatMessage({ id: "reply-1", parentMessageId: "message-1" }),
    );

    await act(async () => {
      await result.current.sendReply!({ content: "a reply" });
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.body).toMatchObject({ content: "a reply", parentMessageId: "message-1" });
  });
});
