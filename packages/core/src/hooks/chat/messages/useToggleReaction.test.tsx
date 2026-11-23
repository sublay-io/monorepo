import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeChatMessage, makeAuthUser } from "../../../test-utils";
import useToggleReaction from "./useToggleReaction";
import { upsertMessage, selectMessages } from "../../../store/slices/chatSlice";

afterEach(() => {
  resetAxiosMocks();
});

describe("useToggleReaction", () => {
  it("adds a reaction and updates the message's reactionCounts/userReactions", async () => {
    const message = makeChatMessage({ id: "message-1", reactionCounts: {}, userReactions: [] });

    const { result, store, axiosPrivate } = renderHookWithAxios(
      () => useToggleReaction(),
      { user: makeAuthUser({ id: "user-1" }) },
    );
    act(() => {
      store.dispatch(upsertMessage(message));
    });

    axiosPrivate.mockResponse("post", {
      reactionCounts: { "👍": 1 },
      userReactions: ["👍"],
      delta: 1,
    });

    let returned;
    await act(async () => {
      returned = await result.current({
        conversationId: "conversation-1",
        messageId: "message-1",
        emoji: "👍",
      });
    });

    expect(returned).toEqual({ reactionCounts: { "👍": 1 }, userReactions: ["👍"], delta: 1 });

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe(
      "/test-project/chat/conversations/conversation-1/messages/message-1/reactions",
    );
    expect(call.body).toEqual({ emoji: "👍" });

    const [stored] = selectMessages("conversation-1")(store.getState());
    expect(stored.reactionCounts).toEqual({ "👍": 1 });
    expect(stored.userReactions).toEqual(["👍"]);
  });

  it("removes a reaction when delta is -1", async () => {
    const message = makeChatMessage({
      id: "message-1",
      reactionCounts: { "👍": 1 },
      userReactions: ["👍"],
    });

    const { result, store, axiosPrivate } = renderHookWithAxios(
      () => useToggleReaction(),
      { user: makeAuthUser({ id: "user-1" }) },
    );
    act(() => {
      store.dispatch(upsertMessage(message));
    });

    axiosPrivate.mockResponse("post", {
      reactionCounts: {},
      userReactions: [],
      delta: -1,
    });

    await act(async () => {
      await result.current({
        conversationId: "conversation-1",
        messageId: "message-1",
        emoji: "👍",
      });
    });

    const [stored] = selectMessages("conversation-1")(store.getState());
    expect(stored.reactionCounts).toEqual({});
    expect(stored.userReactions).toEqual([]);
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useToggleReaction());

    axiosPrivate.mockError("post", 500, { message: "Internal error" });

    await expect(
      result.current({ conversationId: "conversation-1", messageId: "message-1", emoji: "👍" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when there is no projectId", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useToggleReaction(), {
      projectId: "",
    });

    await expect(
      result.current({ conversationId: "conversation-1", messageId: "message-1", emoji: "👍" }),
    ).rejects.toThrow("No projectId available.");
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});
