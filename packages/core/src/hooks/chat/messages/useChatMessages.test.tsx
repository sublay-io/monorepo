import { describe, it, expect, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeChatMessage } from "../../../test-utils";
import useChatMessages from "./useChatMessages";

afterEach(() => {
  resetAxiosMocks();
});

describe("useChatMessages", () => {
  it("forwards to useLiveChatMessages and returns the same shape", async () => {
    const message = makeChatMessage({ id: "message-1" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useChatMessages({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            data: [message],
            pagination: { hasMore: false },
          }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.messages).toEqual([message]);
    expect(result.current.hasMore).toBe(false);
    expect(typeof result.current.loadMore).toBe("function");

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/chat/conversations/conversation-1/messages");
  });
});
