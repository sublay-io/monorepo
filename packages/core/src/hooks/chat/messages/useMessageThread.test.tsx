import { describe, it, expect, afterEach } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeChatMessage } from "../../../test-utils";
import useMessageThread from "./useMessageThread";

afterEach(() => {
  resetAxiosMocks();
});

describe("useMessageThread", () => {
  it("fetches thread replies for the given parentMessageId on mount", async () => {
    const reply = makeChatMessage({
      id: "reply-1",
      parentMessageId: "message-1",
      createdAt: "2024-01-01T00:00:00.000Z",
    });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useMessageThread({ conversationId: "conversation-1", parentMessageId: "message-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            data: [reply],
            pagination: { hasMore: false },
          }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.replies).toEqual([reply]);
    expect(result.current.hasMore).toBe(false);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/chat/conversations/conversation-1/messages");
    expect(call.config?.params).toMatchObject({ sortDir: "asc", parentMessageId: "message-1" });
  });

  it("sendReply automatically attaches the thread's parentMessageId", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useMessageThread({ conversationId: "conversation-1", parentMessageId: "message-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            data: [],
            pagination: { hasMore: false },
          }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockResponse("post", makeChatMessage({ id: "reply-1", parentMessageId: "message-1" }));

    await act(async () => {
      await result.current.sendReply({ content: "a reply" });
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/chat/conversations/conversation-1/messages");
    expect(call.body).toMatchObject({ content: "a reply", parentMessageId: "message-1" });
  });

  it("loadMore delegates to the underlying thread's loadOlder using the after cursor", async () => {
    const reply = makeChatMessage({
      id: "reply-1",
      parentMessageId: "message-1",
      createdAt: "2024-01-01T00:00:00.000Z",
    });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useMessageThread({ conversationId: "conversation-1", parentMessageId: "message-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            data: [reply],
            pagination: { hasMore: true },
          }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const newerReply = makeChatMessage({
      id: "reply-2",
      parentMessageId: "message-1",
      createdAt: "2024-01-02T00:00:00.000Z",
    });
    axiosPrivate.mockResponse("get", {
      data: [newerReply],
      pagination: { hasMore: false },
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.replies.map((r) => r.id)).toEqual(["reply-1", "reply-2"]);

    const calls = axiosPrivate.calls("get");
    expect(calls[1].config?.params).toMatchObject({ after: reply.id });
  });
});
