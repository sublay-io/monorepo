import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../../test-utils";
import useDeleteConversation from "./useDeleteConversation";

afterEach(() => {
  resetAxiosMocks();
});

describe("useDeleteConversation", () => {
  it("deletes a conversation", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteConversation());

    axiosPrivate.mockResponse("delete", undefined, 204);

    await act(async () => {
      await result.current({ conversationId: "conversation-1" });
    });

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/chat/conversations/conversation-1");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteConversation());

    axiosPrivate.mockError("delete", 500, { message: "Internal error" });

    await expect(
      result.current({ conversationId: "conversation-1" }),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("throws before making a request when no conversation ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteConversation());

    await expect(result.current({ conversationId: "" })).rejects.toThrow(
      "Please pass a conversationId.",
    );
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });
});
