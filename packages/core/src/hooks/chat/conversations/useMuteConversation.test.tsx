import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, cleanup, waitFor } from "@testing-library/react";

import {
  renderHookWithStore,
  makeRtkQueryStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  makeAuthUser,
  makeConversationMember,
  type FetchMockHandle,
} from "../../../test-utils";
import { setUser } from "../../../store/slices/userSlice";
import useMuteConversation from "./useMuteConversation";
import type { ConversationMember } from "../../../interfaces/models/ConversationMember";

let fetchHandle: FetchMockHandle;

beforeEach(() => {
  fetchHandle = stubFetchMock(async () => jsonResponse({}, 404));
});

afterEach(() => {
  cleanup();
  unstubFetchMock();
  vi.restoreAllMocks();
});

/** A store with a signed-in user, which the hook requires before muting. */
function storeWithUser() {
  const store = makeRtkQueryStore();
  store.dispatch(setUser(makeAuthUser({ id: "user-1" })));
  return store;
}

/** The JSON body RTK Query sent with the nth fetch call. */
function sentBody(index = 0): unknown {
  const req = fetchHandle.fetchMock.mock.calls[index][0] as { init?: { body?: string } };
  return JSON.parse(req.init?.body ?? "null");
}

describe("useMuteConversation", () => {
  it("POSTs the duration choice to the conversation's mute route and resolves to the updated member", async () => {
    const member = makeConversationMember({
      conversationId: "conversation-1",
      mutedUntil: "2024-01-02T08:00:00.000Z",
      mutedForever: false,
    });
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ currentMember: member }));

    const { result } = renderHookWithStore(() => useMuteConversation(), {
      store: storeWithUser(),
    });

    let returned: ConversationMember | undefined;
    await act(async () => {
      returned = await result.current.muteConversation({
        conversationId: "conversation-1",
        duration: "8h",
      });
    });

    expect(returned).toEqual(member);

    const [call] = fetchHandle.calls();
    expect(call.method).toBe("POST");
    expect(call.url).toMatch(/\/test-project\/chat\/conversations\/conversation-1\/mute$/);
    expect(sentBody()).toEqual({ duration: "8h" });
  });

  it("sends `forever` as the choice and surfaces the member's mutedForever signal", async () => {
    const member = makeConversationMember({ mutedUntil: null, mutedForever: true });
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ currentMember: member }));

    const { result } = renderHookWithStore(() => useMuteConversation(), {
      store: storeWithUser(),
    });

    let returned: ConversationMember | undefined;
    await act(async () => {
      returned = await result.current.muteConversation({
        conversationId: "conversation-1",
        duration: "forever",
      });
    });

    expect(sentBody()).toEqual({ duration: "forever" });
    expect(returned?.mutedForever).toBe(true);
    expect(returned?.mutedUntil).toBeNull();
  });

  it("clears the mute by sending `duration: null` (not omitting it)", async () => {
    const member = makeConversationMember({ mutedUntil: null, mutedForever: false });
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ currentMember: member }));

    const { result } = renderHookWithStore(() => useMuteConversation(), {
      store: storeWithUser(),
    });

    await act(async () => {
      await result.current.muteConversation({ conversationId: "conversation-1", duration: null });
    });

    expect(sentBody()).toEqual({ duration: null });
  });

  it("reports `muting` while the request is in flight", async () => {
    let resolveFetch: (response: Response) => void = () => {};
    fetchHandle.fetchMock.mockImplementationOnce(
      () => new Promise<Response>((resolve) => (resolveFetch = resolve)),
    );

    const { result } = renderHookWithStore(() => useMuteConversation(), {
      store: storeWithUser(),
    });
    expect(result.current.muting).toBe(false);

    let pending: Promise<ConversationMember> | undefined;
    act(() => {
      pending = result.current.muteConversation({ conversationId: "conversation-1", duration: "24h" });
    });

    await waitFor(() => expect(result.current.muting).toBe(true));

    await act(async () => {
      resolveFetch(jsonResponse({ currentMember: makeConversationMember() }));
      await pending;
    });

    await waitFor(() => expect(result.current.muting).toBe(false));
  });

  it("throws without an authenticated user, and sends nothing", async () => {
    const { result } = renderHookWithStore(() => useMuteConversation());

    await expect(
      result.current.muteConversation({ conversationId: "conversation-1", duration: "8h" }),
    ).rejects.toThrow("No project ID or authenticated user available");
    expect(fetchHandle.fetchMock).not.toHaveBeenCalled();
  });

  it("throws without a project id, and sends nothing", async () => {
    const { result } = renderHookWithStore(() => useMuteConversation(), {
      projectId: "",
      store: storeWithUser(),
    });

    await expect(
      result.current.muteConversation({ conversationId: "conversation-1", duration: "8h" }),
    ).rejects.toThrow("No project ID or authenticated user available");
    expect(fetchHandle.fetchMock).not.toHaveBeenCalled();
  });

  it("throws without a conversationId, and sends nothing", async () => {
    const { result } = renderHookWithStore(() => useMuteConversation(), {
      store: storeWithUser(),
    });

    await expect(
      result.current.muteConversation({ conversationId: "", duration: "8h" }),
    ).rejects.toThrow("Please pass a conversationId.");
    expect(fetchHandle.fetchMock).not.toHaveBeenCalled();
  });

  it("logs and rethrows when the server rejects the mute", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "Not a member", code: "chat/not-member" }, 403),
    );

    const { result } = renderHookWithStore(() => useMuteConversation(), {
      store: storeWithUser(),
    });

    // Not wrapped in act(): act() swallows the rejection's follow-up work.
    await expect(
      result.current.muteConversation({ conversationId: "conversation-1", duration: "8h" }),
    ).rejects.toMatchObject({ status: 403 });

    expect(consoleSpy).toHaveBeenCalled();
    expect(String(consoleSpy.mock.calls[0][0])).toContain("Failed to mute conversation");
    await waitFor(() => expect(result.current.muting).toBe(false));
  });
});
