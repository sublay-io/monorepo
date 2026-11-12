import { describe, it, expect, afterEach } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeConversationMember } from "../../../test-utils";
import useConversationMembers from "./useConversationMembers";

afterEach(() => {
  resetAxiosMocks();
});

describe("useConversationMembers", () => {
  it("fetches members on mount", async () => {
    const member = makeConversationMember();

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversationMembers({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", { data: [member] }),
      },
    );

    await waitFor(() => expect(result.current.members).toEqual([member]));
    expect(result.current.loading).toBe(false);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/chat/conversations/conversation-1/members");
  });

  it("adds a member", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversationMembers({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", { data: [] }),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newMember = makeConversationMember({ userId: "user-2" });
    axiosPrivate.mockResponse("post", newMember);

    await act(async () => {
      await result.current.addMember({ userId: "user-2" });
    });

    expect(result.current.members).toEqual([newMember]);
    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/chat/conversations/conversation-1/members");
    expect(call.body).toEqual({ userId: "user-2" });
  });

  it("removes a member", async () => {
    const member = makeConversationMember({ userId: "user-2" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversationMembers({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", { data: [member] }),
      },
    );
    await waitFor(() => expect(result.current.members).toEqual([member]));

    axiosPrivate.mockResponse("delete", undefined, 204);

    await act(async () => {
      await result.current.removeMember({ userId: "user-2" });
    });

    expect(result.current.members).toEqual([]);
    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/chat/conversations/conversation-1/members/user-2");
  });

  it("changes a member's role", async () => {
    const member = makeConversationMember({ userId: "user-2", role: "member" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversationMembers({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", { data: [member] }),
      },
    );
    await waitFor(() => expect(result.current.members).toEqual([member]));

    const updated = { ...member, role: "admin" as const };
    axiosPrivate.mockResponse("patch", updated);

    await act(async () => {
      await result.current.changeRole({ userId: "user-2", role: "admin" });
    });

    expect(result.current.members).toEqual([updated]);
    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/chat/conversations/conversation-1/members/user-2/role");
  });

  it("leaves the conversation", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversationMembers({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", { data: [] }),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockResponse("delete", undefined, 204);

    await act(async () => {
      await result.current.leave();
    });

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/chat/conversations/conversation-1/members/me");
  });

  it("upsertMember and removeMemberLocally manage state without an API call", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversationMembers({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", { data: [] }),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    const member = makeConversationMember({ userId: "user-3" });
    act(() => {
      result.current.upsertMember(member);
    });
    expect(result.current.members).toEqual([member]);

    act(() => {
      result.current.removeMemberLocally({ userId: "user-3" });
    });
    expect(result.current.members).toEqual([]);

    expect(axiosPrivate.calls("post")).toHaveLength(0);
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });

  it("rejects and rethrows when adding a member fails", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversationMembers({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", { data: [] }),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockError("post", 500, { message: "Internal error" });

    await expect(result.current.addMember({ userId: "user-2" })).rejects.toMatchObject({
      response: { status: 500 },
    });
    expect(result.current.members).toEqual([]);
  });
});
