import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeConversation,
  makeConversationMember,
} from "../../../test-utils";
import useCreateDirectConversation from "./useCreateDirectConversation";
import { selectConversation, setConversation } from "../../../store/slices/chatSlice";

afterEach(() => {
  resetAxiosMocks();
});

describe("useCreateDirectConversation", () => {
  it("creates a direct conversation, reports created: true on 201, and stores it in the chat slice", async () => {
    const { result, store, axiosPrivate } = renderHookWithAxios(() =>
      useCreateDirectConversation(),
    );

    const conversation = makeConversation({ type: "direct" });
    axiosPrivate.mockResponse("post", conversation, 201);

    let returned;
    await act(async () => {
      returned = await result.current({ userId: "user-2" });
    });

    expect(returned).toEqual({ conversation, created: true });
    expect(selectConversation(conversation.id)(store.getState())).toEqual(conversation);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/chat/conversations/direct");
    expect(call.body).toEqual({ userId: "user-2" });
  });

  it("merges into a loaded copy, keeping its currentMember and memberCount", async () => {
    const { result, store, axiosPrivate } = renderHookWithAxios(() =>
      useCreateDirectConversation(),
    );
    const currentMember = makeConversationMember({ id: "member-me" });
    act(() => {
      store.dispatch(
        setConversation(makeConversation({ type: "direct", currentMember, memberCount: 2 })),
      );
    });

    const conversation = makeConversation({ type: "direct", lastMessageAt: "2024-01-03T00:00:00.000Z" });
    axiosPrivate.mockResponse("post", conversation, 200);

    await act(async () => {
      await result.current({ userId: "user-2" });
    });

    expect(selectConversation(conversation.id)(store.getState())).toEqual({
      ...conversation,
      currentMember,
      memberCount: 2,
    });
  });

  it("reports created: false on 200 when the conversation already exists", async () => {
    const { result, store, axiosPrivate } = renderHookWithAxios(() =>
      useCreateDirectConversation(),
    );

    const conversation = makeConversation({ type: "direct" });
    axiosPrivate.mockResponse("post", conversation, 200);

    let returned;
    await act(async () => {
      returned = await result.current({ userId: "user-2" });
    });

    expect(returned).toEqual({ conversation, created: false });
    expect(selectConversation(conversation.id)(store.getState())).toEqual(conversation);
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useCreateDirectConversation(),
    );

    axiosPrivate.mockError("post", 500, { message: "Internal error" });

    await expect(
      result.current({ userId: "user-2" }),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("throws before making a request when no user ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useCreateDirectConversation(),
    );

    await expect(result.current({ userId: "" })).rejects.toThrow(
      "Please pass a userId.",
    );
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});
