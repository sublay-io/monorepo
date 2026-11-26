import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeConversation } from "../../../test-utils";
import useFetchConversation from "./useFetchConversation";

afterEach(() => {
  resetAxiosMocks();
});

describe("useFetchConversation", () => {
  it("fetches a conversation by ID", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchConversation());

    const conversation = makeConversation();
    axiosPrivate.mockResponse("get", conversation);

    let returned;
    await act(async () => {
      returned = await result.current({ conversationId: "conversation-1" });
    });

    expect(returned).toEqual(conversation);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/chat/conversations/conversation-1");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchConversation());

    axiosPrivate.mockError("get", 404, { message: "Not found" });

    await expect(
      result.current({ conversationId: "conversation-1" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws before making a request when no conversation ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchConversation());

    await expect(result.current({ conversationId: "" })).rejects.toThrow(
      "Please pass a conversationId.",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});
