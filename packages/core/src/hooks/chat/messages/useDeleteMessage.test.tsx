import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeChatMessage, makeAuthUser } from "../../../test-utils";
import useDeleteMessage from "./useDeleteMessage";
import { upsertMessage, selectMessages } from "../../../store/slices/chatSlice";

afterEach(() => {
  resetAxiosMocks();
});

describe("useDeleteMessage", () => {
  it("deletes the message on the server and leaves the author's deleted placeholder locally", async () => {
    const message = makeChatMessage({
      id: "message-1",
      userId: "user-1",
      content: "hi",
      metadata: { pinned: true },
    });

    const { result, store, axiosPrivate } = renderHookWithAxios(() => useDeleteMessage(), {
      user: makeAuthUser({ id: "user-1" }),
    });
    act(() => {
      store.dispatch(upsertMessage(message));
    });

    axiosPrivate.mockResponse("delete", undefined, 204);

    await act(async () => {
      await result.current({ conversationId: "conversation-1", messageId: "message-1" });
    });

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/chat/conversations/conversation-1/messages/message-1");

    const messages = selectMessages("conversation-1")(store.getState());
    expect(messages[0].content).toBeNull();
    expect(messages[0].metadata).toBeNull();
    expect(messages[0].userDeletedAt).not.toBeNull();
    expect(messages[0].userId).toBe("user-1");
    expect(messages[0].moderationStatus).not.toBe("removed");
  });

  it("an admin deleting someone else's message leaves a removed placeholder, sender blanked", async () => {
    const message = makeChatMessage({ id: "message-1", userId: "user-other", content: "hi" });

    const { result, store, axiosPrivate } = renderHookWithAxios(() => useDeleteMessage(), {
      user: makeAuthUser({ id: "user-admin" }),
    });
    act(() => {
      store.dispatch(upsertMessage(message));
    });

    axiosPrivate.mockResponse("delete", undefined, 204);

    await act(async () => {
      await result.current({ conversationId: "conversation-1", messageId: "message-1" });
    });

    const [m] = selectMessages("conversation-1")(store.getState());
    expect(m).toMatchObject({
      moderationStatus: "removed",
      userDeletedAt: null,
      userId: null,
      user: null,
      content: null,
      metadata: null,
    });
  });

  it("rejects and leaves the message untouched when the server request fails", async () => {
    const message = makeChatMessage({ id: "message-1", content: "hi" });

    const { result, store, axiosPrivate } = renderHookWithAxios(() => useDeleteMessage());
    act(() => {
      store.dispatch(upsertMessage(message));
    });

    axiosPrivate.mockError("delete", 500, { message: "Internal error" });

    await expect(
      result.current({ conversationId: "conversation-1", messageId: "message-1" }),
    ).rejects.toMatchObject({ response: { status: 500 } });

    const messages = selectMessages("conversation-1")(store.getState());
    expect(messages[0].content).toBe("hi");
  });

  it("throws before making a request when there is no projectId", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteMessage(), {
      projectId: "",
    });

    await expect(
      result.current({ conversationId: "conversation-1", messageId: "message-1" }),
    ).rejects.toThrow("No projectId available.");
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });
});
