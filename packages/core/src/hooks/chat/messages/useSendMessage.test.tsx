import { describe, it, expect, afterEach, vi } from "vitest";
import { act } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeChatMessage,
  makeConversation,
  makeAuthUser,
} from "../../../test-utils";
import useSendMessage, { type SendMessageResult } from "./useSendMessage";
import { selectMessages, setConversation } from "../../../store/slices/chatSlice";

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

    let promise!: Promise<SendMessageResult>;
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

  it("builds the optimistic message with the stored conversation's spaceId, no quote", async () => {
    const { result, store, axiosPrivate } = renderHookWithAxios(
      () => useSendMessage({ conversationId: "conversation-1" }),
      { user: makeAuthUser({ id: "user-1" }) },
    );
    act(() => {
      store.dispatch(
        setConversation(makeConversation({ id: "conversation-1", type: "space", spaceId: "space-1" })),
      );
    });

    axiosPrivate.mockResponse("post", makeChatMessage({ id: "message-1", spaceId: "space-1" }));

    let promise!: Promise<SendMessageResult>;
    act(() => {
      promise = result.current({ content: "hi", quotedMessageId: "message-0" });
    });

    const [optimistic] = selectMessages("conversation-1")(store.getState());
    expect(optimistic.spaceId).toBe("space-1");
    expect(optimistic.quotedMessageId).toBe("message-0");
    expect(optimistic.quotedMessage).toBeNull();
    expect(optimistic).not.toHaveProperty("projectId");

    await act(async () => {
      await promise;
    });
  });

  it("uses a null spaceId on the optimistic message when the conversation isn't loaded", async () => {
    const { result, store, axiosPrivate } = renderHookWithAxios(() =>
      useSendMessage({ conversationId: "conversation-1" }),
    );
    axiosPrivate.mockResponse("post", makeChatMessage({ id: "message-1" }));

    let promise!: Promise<SendMessageResult>;
    act(() => {
      promise = result.current({ content: "hi" });
    });
    expect(selectMessages("conversation-1")(store.getState())[0].spaceId).toBeNull();
    await act(async () => {
      await promise;
    });
  });

  it("leaves a null gif out of a multipart send", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useSendMessage({ conversationId: "conversation-1" }),
    );
    axiosPrivate.mockResponse("post", makeChatMessage());

    await act(async () => {
      await result.current({ content: "hi", gif: null, files: { files: [new Blob(["x"])] } });
    });

    const [call] = axiosPrivate.calls("post");
    const form = call.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect(form.has("gif")).toBe(false);
    expect(form.get("content")).toBe("hi");
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
      await result.current({ content: "look", files: { files: [file] } });
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.body instanceof FormData).toBe(true);
    const formData = call.body as FormData;
    expect(formData.get("content")).toBe("look");
    expect(formData.get("files")).toBeInstanceOf(File);
    expect(formData.getAll("files")).toHaveLength(1);
    expect(formData.has("files.options")).toBe(false);
    expect(formData.has("images")).toBe(false);
  });

  it("sends images with images.options and files with files.options", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useSendMessage({ conversationId: "conversation-1" }),
    );

    axiosPrivate.mockResponse("post", makeChatMessage());

    const photo = new File(["binary"], "photo.png", { type: "image/png" });
    const doc = new File(["pdf"], "doc.pdf", { type: "application/pdf" });

    await act(async () => {
      await result.current({
        images: { files: [photo, photo], options: { mode: "original-aspect" } as any },
        files: { files: [doc], options: { pathParts: ["chat"] } },
      });
    });

    const [call] = axiosPrivate.calls("post");
    const formData = call.body as FormData;
    expect(formData.getAll("images")).toHaveLength(2);
    expect(JSON.parse(formData.get("images.options") as string)).toEqual({
      mode: "original-aspect",
    });
    expect(formData.getAll("files")).toHaveLength(1);
    expect(JSON.parse(formData.get("files.options") as string)).toEqual({
      pathParts: ["chat"],
    });
  });

  it("sends the spaceReputation options in the JSON body, no query", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useSendMessage({ conversationId: "conversation-1" }),
    );

    axiosPrivate.mockResponse("post", makeChatMessage());

    await act(async () => {
      await result.current({
        content: "hi",
        spaceReputation: { spaceId: "space-1", includeDescendants: true },
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
        files: { files: [file] },
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
      status: 500,
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
