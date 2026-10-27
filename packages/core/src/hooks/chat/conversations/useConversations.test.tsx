import { describe, it, expect, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeConversationPreview } from "../../../test-utils";
import { makeProvidersWrapper } from "../../../context/testHelpers";
import { setSocketConnected } from "../../../store/slices/chatSlice";
import useConversations, { type UseConversationsProps } from "./useConversations";

afterEach(() => {
  resetAxiosMocks();
});

describe("useConversations", () => {
  it("fetches the first page on mount and computes a cursor from the last item", async () => {
    const first = makeConversationPreview({ id: "conversation-1", lastMessageAt: "2024-01-02T00:00:00.000Z", createdAt: "2024-01-01T00:00:00.000Z" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversations(),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", { conversations: [first], hasMore: true }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.conversations).toEqual([first]);
    expect(result.current.hasMore).toBe(true);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/chat/conversations");
    expect(call.config?.params).toMatchObject({ limit: "20" });
  });

  it("loads more using the derived cursor", async () => {
    const first = makeConversationPreview({ id: "conversation-1", lastMessageAt: "2024-01-02T00:00:00.000Z", createdAt: "2024-01-01T00:00:00.000Z" });
    const second = makeConversationPreview({ id: "conversation-2" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversations(),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", { conversations: [first], hasMore: true }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockResponse("get", { conversations: [second], hasMore: false });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.conversations.map((c) => c.id)).toEqual(["conversation-1", "conversation-2"]);
    expect(result.current.hasMore).toBe(false);

    const calls = axiosPrivate.calls("get");
    expect(calls[1].config?.params).toMatchObject({
      cursor: new Date(first.lastMessageAt!).toISOString(),
      cursorCreatedAt: new Date(first.createdAt).toISOString(),
    });
  });

  it("filters by types", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversations({ types: ["group", "direct"] }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", { conversations: [], hasMore: false }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const [call] = axiosPrivate.calls("get");
    // Sent in the order passed, not sorted — sorting only happens internally
    // for the effect's dependency key, not the request param.
    expect(call.config?.params).toMatchObject({ types: "group,direct" });
  });

  it("creates a group conversation and prepends it to the list", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversations(),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", { conversations: [], hasMore: false }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const group = makeConversationPreview({ id: "group-1", type: "group", name: "Team" });
    axiosPrivate.mockResponse("post", group);

    let returned;
    await act(async () => {
      returned = await result.current.createGroup({ name: "Team", memberIds: ["user-2"] });
    });

    expect(returned).toEqual(group);
    expect(result.current.conversations).toEqual([group]);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/chat/conversations");
    expect(call.body).toEqual({ type: "group", name: "Team", memberIds: ["user-2"] });
  });

  // ── Reconnect reconciliation ────────────────────────────────────────────────
  // `socketConnected` is written to the store by ChatProvider from the socket's
  // own connect/disconnect events; here it is dispatched directly.
  describe("reconnect refresh", () => {
    function renderWithStore(props: UseConversationsProps = {}, { connectedAtMount = false } = {}) {
      const { Wrapper, store, axiosPrivate } = makeProvidersWrapper({
        accessToken: "token-1",
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            conversations: [
              makeConversationPreview({
                id: "conversation-1",
                lastMessageAt: "2024-01-02T00:00:00.000Z",
                createdAt: "2024-01-01T00:00:00.000Z",
              }),
            ],
            hasMore: true,
          }),
      });
      if (connectedAtMount) store.dispatch(setSocketConnected(true));
      const rendered = renderHook(() => useConversations(props), { wrapper: Wrapper });
      return { ...rendered, store, axiosPrivate };
    }

    it("does not refetch on the first connect (the mount fetch already loaded page 1)", async () => {
      const { result, store, axiosPrivate } = renderWithStore();
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(axiosPrivate.calls("get")).toHaveLength(1);

      act(() => {
        store.dispatch(setSocketConnected(true));
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(axiosPrivate.calls("get")).toHaveLength(1);
    });

    it("reloads page 1 (cursor reset, list replaced) when the socket goes disconnected → connected", async () => {
      const { result, store, axiosPrivate } = renderWithStore({ types: ["group"] });
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Paginate past page 1 so a reconnect has a cursor to reset.
      axiosPrivate.mockResponse("get", {
        conversations: [makeConversationPreview({ id: "conversation-2" })],
        hasMore: false,
      });
      await act(async () => {
        await result.current.loadMore();
      });
      expect(result.current.conversations.map((c) => c.id)).toEqual([
        "conversation-1",
        "conversation-2",
      ]);

      act(() => {
        store.dispatch(setSocketConnected(true));
      });
      act(() => {
        store.dispatch(setSocketConnected(false));
      });
      // Disconnecting alone fetches nothing.
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(axiosPrivate.calls("get")).toHaveLength(2);

      // While offline, a new conversation moved to the top.
      const fresh = makeConversationPreview({ id: "conversation-3" });
      axiosPrivate.mockResponse("get", {
        conversations: [fresh, makeConversationPreview({ id: "conversation-1" })],
        hasMore: true,
      });
      act(() => {
        store.dispatch(setSocketConnected(true));
      });

      await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(3));
      await waitFor(() =>
        expect(result.current.conversations.map((c) => c.id)).toEqual([
          "conversation-3",
          "conversation-1",
        ]),
      );
      expect(result.current.hasMore).toBe(true);

      const refreshCall = axiosPrivate.calls("get")[2];
      expect(refreshCall.url).toBe("/test-project/chat/conversations");
      // First page: no cursor, and the `types` filter is kept.
      expect(refreshCall.config?.params).toEqual({ limit: "20", types: "group" });
    });

    // ChatProvider at the app root, inbox screen opened later: the socket is
    // already connected when the hook mounts.
    it("reloads page 1 on the first reconnect when mounted while the socket was already connected", async () => {
      const { result, store, axiosPrivate } = renderWithStore({}, { connectedAtMount: true });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(axiosPrivate.calls("get")).toHaveLength(1);

      act(() => {
        store.dispatch(setSocketConnected(false));
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(axiosPrivate.calls("get")).toHaveLength(1);

      act(() => {
        store.dispatch(setSocketConnected(true));
      });
      await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(2));
    });

    it("reloads page 1 again on each later reconnect", async () => {
      const { result, store, axiosPrivate } = renderWithStore();
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        store.dispatch(setSocketConnected(true));
      });

      for (let n = 2; n <= 3; n++) {
        act(() => {
          store.dispatch(setSocketConnected(false));
        });
        axiosPrivate.mockResponse("get", { conversations: [], hasMore: false });
        act(() => {
          store.dispatch(setSocketConnected(true));
        });
        await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(n));
        expect(axiosPrivate.calls("get")[n - 1].config?.params).toEqual({ limit: "20" });
      }
    });
  });
});
