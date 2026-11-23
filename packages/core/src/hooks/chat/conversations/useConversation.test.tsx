import { describe, it, expect, afterEach } from "vitest";
import { act, waitFor } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeConversation,
  makeConversationMember,
  makeConversationPreview,
} from "../../../test-utils";
import {
  insertConversationPreview,
  forgetCurrentMember,
  removeConversationPreview,
} from "../../../store/slices/chatSlice";
import useConversation from "./useConversation";

afterEach(() => {
  resetAxiosMocks();
});

describe("useConversation", () => {
  it("fetches the conversation on mount when not already in the store", async () => {
    const conversation = makeConversation({ id: "conversation-1", currentMember: null });

    const { result } = renderHookWithAxios(
      () => useConversation({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", conversation),
      },
    );

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.conversation).toEqual(conversation));
    expect(result.current.loading).toBe(false);
  });

  it("fetches when the store holds only an inbox preview (e.g. a group just created)", async () => {
    const admin = makeConversationMember({ id: "member-me", role: "admin" });
    const conversation = makeConversation({ id: "conversation-1", currentMember: admin, memberCount: 1 });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversation({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate, store }) => {
          store.dispatch(insertConversationPreview(makeConversationPreview({ id: "conversation-1" })));
          axiosPrivate.mockResponse("get", conversation);
        },
      },
    );

    await waitFor(() => expect(result.current.conversation?.currentMember?.role).toBe("admin"));
    expect(axiosPrivate.calls("get")).toHaveLength(1);
  });

  it("refetches an open conversation when its currentMember is forgotten (re-added)", async () => {
    const first = makeConversation({ id: "conversation-1", currentMember: makeConversationMember({ role: "member" }) });
    const second = makeConversation({ id: "conversation-1", currentMember: makeConversationMember({ role: "admin" }) });

    const { result, axiosPrivate, store } = renderHookWithAxios(
      () => useConversation({ conversationId: "conversation-1" }),
      { beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", first) },
    );
    await waitFor(() => expect(result.current.conversation?.currentMember?.role).toBe("member"));

    axiosPrivate.mockResponse("get", second);
    act(() => {
      store.dispatch(forgetCurrentMember("conversation-1"));
    });
    await waitFor(() => expect(result.current.conversation?.currentMember?.role).toBe("admin"));
    expect(axiosPrivate.calls("get")).toHaveLength(2);
  });

  it("doesn't refetch when the open conversation is removed, and refetches when re-added", async () => {
    const before = makeConversation({ id: "conversation-1", currentMember: makeConversationMember({ role: "member" }) });
    const after = makeConversation({ id: "conversation-1", currentMember: makeConversationMember({ role: "admin" }) });

    const { result, axiosPrivate, store } = renderHookWithAxios(
      () => useConversation({ conversationId: "conversation-1" }),
      { beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", before) },
    );
    await waitFor(() => expect(result.current.conversation?.currentMember?.role).toBe("member"));

    act(() => {
      store.dispatch(removeConversationPreview("conversation-1"));
    });
    expect(axiosPrivate.calls("get")).toHaveLength(1);

    axiosPrivate.mockResponse("get", after);
    act(() => {
      store.dispatch(insertConversationPreview(makeConversationPreview({ id: "conversation-1" })));
    });
    await waitFor(() => expect(result.current.conversation?.currentMember?.role).toBe("admin"));
    expect(axiosPrivate.calls("get")).toHaveLength(2);
  });

  it("does not throw and stops loading when the fetch fails", async () => {
    const { result } = renderHookWithAxios(
      () => useConversation({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockError("get", 500, { message: "Internal error" }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.conversation).toBeNull();
  });

  it("updates the conversation and reflects the change", async () => {
    const conversation = makeConversation({ id: "conversation-1", name: "Old", currentMember: null });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversation({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", conversation),
      },
    );

    await waitFor(() => expect(result.current.conversation).toEqual(conversation));

    const updated = { ...conversation, name: "New" };
    axiosPrivate.mockResponse("patch", updated);

    let returned;
    await act(async () => {
      returned = await result.current.update({ name: "New" });
    });

    expect(returned).toEqual(updated);
    expect(result.current.conversation).toEqual(updated);

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/chat/conversations/conversation-1");
    expect(call.body).toEqual({ name: "New" });
  });

  it("deletes the conversation", async () => {
    const conversation = makeConversation({ id: "conversation-1", currentMember: null });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversation({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", conversation),
      },
    );

    await waitFor(() => expect(result.current.conversation).toEqual(conversation));

    axiosPrivate.mockResponse("delete", undefined, 204);

    await act(async () => {
      await result.current.deleteConversation();
    });

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/chat/conversations/conversation-1");
  });
});
