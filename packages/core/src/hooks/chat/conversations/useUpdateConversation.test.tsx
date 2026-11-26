import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeConversation } from "../../../test-utils";
import useUpdateConversation from "./useUpdateConversation";

afterEach(() => {
  resetAxiosMocks();
});

describe("useUpdateConversation", () => {
  it("updates a conversation", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateConversation());

    const updated = makeConversation({ name: "New name" });
    axiosPrivate.mockResponse("patch", updated);

    let returned;
    await act(async () => {
      returned = await result.current({ conversationId: "conversation-1", name: "New name" });
    });

    expect(returned).toEqual(updated);

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/chat/conversations/conversation-1");
    expect(call.body).toEqual({ name: "New name" });
  });

  it("sends a new avatar as multipart avatarFile + avatarFile.options", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateConversation());
    axiosPrivate.mockResponse("patch", makeConversation());

    const file = new File(["bytes"], "a.png", { type: "image/png" });
    const options = { mode: "original-aspect" as const, sizes: { small: 64 } };
    await act(async () => {
      await result.current({ conversationId: "conversation-1", name: "New name", avatarFile: { file, options } });
    });

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/chat/conversations/conversation-1");
    expect(call.body).toBeInstanceOf(FormData);
    const formData = call.body as FormData;
    expect(formData.get("avatarFile")).toBeInstanceOf(File);
    expect(formData.get("avatarFile.options")).toBe(JSON.stringify(options));
    expect(formData.get("name")).toBe("New name");
    expect(formData.has("avatar")).toBe(false);
    expect(formData.has("removeFileIds")).toBe(false);
  });

  it("sends removeFileIds alone as a JSON array", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateConversation());
    axiosPrivate.mockResponse("patch", makeConversation());

    await act(async () => {
      await result.current({ conversationId: "conversation-1", removeFileIds: ["file-1"] });
    });

    const [call] = axiosPrivate.calls("patch");
    expect(call.body instanceof FormData).toBe(false);
    expect(call.body).toEqual({ removeFileIds: ["file-1"] });
  });

  it("sends removeFileIds as a JSON string next to a new avatar", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateConversation());
    axiosPrivate.mockResponse("patch", makeConversation());

    const file = new File(["bytes"], "a.png", { type: "image/png" });
    const options = { mode: "original-aspect" as const, sizes: { small: 64 } };
    await act(async () => {
      await result.current({
        conversationId: "conversation-1",
        avatarFile: { file, options },
        removeFileIds: ["old-avatar"],
      });
    });

    const [call] = axiosPrivate.calls("patch");
    const formData = call.body as FormData;
    expect(formData.get("removeFileIds")).toBe(JSON.stringify(["old-avatar"]));
    expect(formData.get("avatarFile")).toBeInstanceOf(File);
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateConversation());

    axiosPrivate.mockError("patch", 500, { message: "Internal error" });

    await expect(
      result.current({ conversationId: "conversation-1", name: "New name" }),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("throws before making a request when no conversation ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateConversation());

    await expect(
      result.current({ conversationId: "", name: "New name" }),
    ).rejects.toThrow("Please pass a conversationId.");
    expect(axiosPrivate.calls("patch")).toHaveLength(0);
  });
});
