import { describe, it, expect, afterEach, vi } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeChatMessage, makeAuthUser } from "../../../test-utils";
import useSendMessage from "./useSendMessage";
import { selectMessages } from "../../../store/slices/chatSlice";
import type { ChatMessage } from "../../../interfaces/models/ChatMessage";

afterEach(() => {
  resetAxiosMocks();
});

describe("useSendMessage", () => {
  it("inserts an optimistic message immediately, then replaces it with the confirmed one", async () => {
    const { result, store, axiosPrivate } = renderHookWithAxios(
      () => useSendMessage({ conversationId: "conversation-1" }),
      { user: makeAuthUser({ id: "user-1" }) },
    );

    const confirmedTemplate = makeChatMessage({ id: "message-1", content: "hi" });
    // The real server echoes back the localId sent in the request — mirror that
    // so the reducer's optimistic-placeholder matching can be exercised for real.
    (axiosPrivate.instance.post as ReturnType<typeof vi.fn>).mockImplementationOnce(
      async (_url: string, body: any) => ({
        data: { ...confirmedTemplate, localId: body.localId },
      }),
    );

    let promise!: Promise<ChatMessage>;
    act(() => {
      promise = result.current({ content: "hi" });
    });

    // Optimistic placeholder is in the store synchronously, before the request resolves
    const optimistic = selectMessages("conversation-1")(store.getState());
    expect(optimistic).toHaveLength(1);
    expect(optimistic[0].id).toMatch(/^temp-/);
    expect(optimistic[0].content).toBe("hi");
    expect(optimistic[0].userId).toBe("user-1");

    await act(async () => {
      await promise;
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/chat/conversations/conversation-1/messages");
    expect(call.body).toMatchObject({ content: "hi" });
    expect(call.body).toHaveProperty("localId");

    const final = selectMessages("conversation-1")(store.getState());
    expect(final).toEqual([{ ...confirmedTemplate, localId: (call.body as any).localId }]);
  });

  it("sends gif/mentions/metadata/quotedMessageId/parentMessageId as JSON when there are no files", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useSendMessage({ conversationId: "conversation-1" }),
    );

    axiosPrivate.mockResponse("post", makeChatMessage());

    await act(async () => {
      await result.current({
        content: "hi",
        gif: { url: "https://example.com/a.gif", width: 10, height: 10 } as any,
        mentions: [{ id: "user-2", indices: [0, 1] } as any],
        metadata: { source: "test" },
        quotedMessageId: "message-0",
        parentMessageId: "message-parent",
      });
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.body).toMatchObject({
      content: "hi",
      quotedMessageId: "message-0",
      parentMessageId: "message-parent",
      metadata: { source: "test" },
    });
    expect(call.body).not.toBeInstanceOf(FormData);
  });

  it("sends a multipart request when files are attached", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useSendMessage({ conversationId: "conversation-1" }),
    );

    axiosPrivate.mockResponse("post", makeChatMessage());

    const file = new File(["binary"], "photo.png", { type: "image/png" });

    await act(async () => {
      await result.current({ content: "look", files: [file] });
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.body instanceof FormData).toBe(true);
    const formData = call.body as FormData;
    expect(formData.get("content")).toBe("look");
    expect(formData.get("files")).toBeInstanceOf(File);
    expect(formData.getAll("files")).toHaveLength(1);
  });

  it("sends the spaceReputation options in the JSON body, no query", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useSendMessage({ conversationId: "conversation-1" }),
    );

    axiosPrivate.mockResponse("post", makeChatMessage());

    await act(async () => {
      await result.current({
        content: "hi",
        spaceReputationId: "space-1",
        spaceReputationDescendants: true,
      });
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.body).toMatchObject({
      content: "hi",
      spaceReputationId: "space-1",
      spaceReputationDescendants: true,
    });
    expect(call.config?.params).toBeUndefined();
  });

  it("sends the spaceReputation options as form fields on a multipart send", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useSendMessage({ conversationId: "conversation-1" }),
    );

    axiosPrivate.mockResponse("post", makeChatMessage());

    const file = new File(["binary"], "photo.png", { type: "image/png" });

    await act(async () => {
      await result.current({
        files: [file],
        spaceReputation: { spaceId: "space-1", includeDescendants: false },
      });
    });

    const [call] = axiosPrivate.calls("post");
    const formData = call.body as FormData;
    expect(formData.get("spaceReputationId")).toBe("space-1");
    expect(formData.get("spaceReputationDescendants")).toBe("false");
    expect(call.config?.params).toBeUndefined();
  });

  it("marks the optimistic message as failed and rethrows when the request fails", async () => {
    const { result, store, axiosPrivate } = renderHookWithAxios(() =>
      useSendMessage({ conversationId: "conversation-1" }),
    );

    axiosPrivate.mockError("post", 500, { message: "Internal error" });

    await expect(result.current({ content: "hi" })).rejects.toMatchObject({
      response: { status: 500 },
    });

    const messages = selectMessages("conversation-1")(store.getState());
    expect(messages).toHaveLength(1);
    expect(messages[0].sendFailed).toBe(true);
  });

  it("throws before sending when there is no projectId", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useSendMessage({ conversationId: "conversation-1" }),
      { projectId: "" },
    );

    await expect(result.current({ content: "hi" })).rejects.toThrow(
      "No projectId available.",
    );
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});
