import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeConversationPreview,
} from "../../../test-utils";
import useFetchConversationPreview from "./useFetchConversationPreview";

afterEach(() => {
  resetAxiosMocks();
});

describe("useFetchConversationPreview", () => {
  it("fetches a conversation preview by ID from the preview endpoint", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchConversationPreview()
    );

    const preview = makeConversationPreview({ id: "conversation-1", unreadCount: 3 });
    axiosPrivate.mockResponse("get", preview);

    let returned;
    await act(async () => {
      returned = await result.current({ conversationId: "conversation-1" });
    });

    expect(returned).toEqual(preview);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe(
      "/test-project/chat/conversations/conversation-1/preview"
    );
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchConversationPreview()
    );

    axiosPrivate.mockError("get", 403, { message: "Forbidden" });

    await expect(
      result.current({ conversationId: "conversation-1" })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("throws before making a request when no conversation ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchConversationPreview()
    );

    await expect(result.current({ conversationId: "" })).rejects.toThrow(
      "Please pass a conversationId."
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});
