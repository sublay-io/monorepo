import { describe, it, expect, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeConversation,
  makeConversationPreview,
} from "../../../test-utils";
import { makeProvidersWrapper } from "../../../context/testHelpers";
import { setSocketConnected } from "../../../store/slices/chatSlice";
import useConversations, { type UseConversationsProps } from "./useConversations";

afterEach(() => {
  resetAxiosMocks();
});

// A server page: `nextCursor` is opaque and `null` on the last page.
function listPage(items: unknown[], nextCursor: string | null = null) {
  return { data: items, pagination: { nextCursor, hasMore: nextCursor !== null } };
}

describe("useConversations", () => {
  it("fetches the first page on mount and stores the server's nextCursor", async () => {
    const first = makeConversationPreview({ id: "conversation-1", lastMessageAt: "2024-01-02T00:00:00.000Z", createdAt: "2024-01-01T00:00:00.000Z" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversations(),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", listPage([first], "cursor-1")),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.conversations).toEqual([first]);
    expect(result.current.hasMore).toBe(true);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/chat/conversations");
    expect(call.config?.params).toMatchObject({ limit: "20" });
  });

  it("loads more by sending the stored nextCursor back as cursor", async () => {
    const first = makeConversationPreview({ id: "conversation-1", lastMessageAt: "2024-01-02T00:00:00.000Z", createdAt: "2024-01-01T00:00:00.000Z" });
    const second = makeConversationPreview({ id: "conversation-2" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversations(),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", listPage([first], "cursor-2")),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockResponse("get", listPage([second]));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.conversations.map((c) => c.id)).toEqual(["conversation-1", "conversation-2"]);
    expect(result.current.hasMore).toBe(false);

    const calls = axiosPrivate.calls("get");
    expect(calls[1].config?.params).toEqual({ limit: "20", cursor: "cursor-2" });
  });

  it("pages through with each page's nextCursor and stops when it is null", async () => {
    const { result, store, axiosPrivate } = renderHookWithAxios(
      () => useConversations(),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse(
            "get",
            listPage([makeConversationPreview({ id: "conversation-1" })], "cursor-a"),
          ),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(store.getState().sublay.chat.conversationList.cursor).toBe("cursor-a");

    axiosPrivate.mockResponse(
      "get",
      listPage([makeConversationPreview({ id: "conversation-2" })], "cursor-b"),
    );
    await act(async () => {
      await result.current.loadMore();
    });
    axiosPrivate.mockResponse("get", listPage([makeConversationPreview({ id: "conversation-3" })]));
    await act(async () => {
      await result.current.loadMore();
    });

    const calls = axiosPrivate.calls("get");
    expect(calls).toHaveLength(3);
    expect(calls[1].config?.params.cursor).toBe("cursor-a");
    expect(calls[2].config?.params.cursor).toBe("cursor-b");
    expect(result.current.conversations.map((c) => c.id)).toEqual([
      "conversation-1",
      "conversation-2",
      "conversation-3",
    ]);
    expect(result.current.hasMore).toBe(false);
    expect(store.getState().sublay.chat.conversationList.cursor).toBeNull();

    // The last page reached: loadMore sends nothing.
    await act(async () => {
      await result.current.loadMore();
    });
    expect(axiosPrivate.calls("get")).toHaveLength(3);
  });


  it("filters by types", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversations({ types: ["group", "direct"] }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", listPage([])),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const [call] = axiosPrivate.calls("get");
    // Sent in the order passed, not sorted — sorting only happens internally
    // for the effect's dependency key, not the request param.
    expect(call.config?.params).toMatchObject({ types: "group,direct" });
  });

  it("creates a group, then fetches its preview and inserts that into the list", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversations(),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", listPage([])),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const group = makeConversation({ id: "group-1", type: "group", name: "Team", description: "Planning" });
    const preview = makeConversationPreview({
      id: "group-1",
      type: "group",
      name: "Team",
      description: "Planning",
      memberCount: 2,
      otherMembers: [{ id: "user-2", name: null, username: "sam", avatar: null }],
    });
    axiosPrivate.mockResponse("post", group, 201);
    axiosPrivate.mockResponse("get", preview);

    let returned;
    await act(async () => {
      returned = await result.current.createGroup({
        name: "Team",
        description: "Planning",
        memberIds: ["user-2"],
      });
    });

    expect(returned).toEqual(group);
    // The list holds the preview, not the bare conversation.
    expect(result.current.conversations).toEqual([preview]);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/chat/conversations");
    expect(call.body).toEqual({
      type: "group",
      name: "Team",
      description: "Planning",
      memberIds: ["user-2"],
    });
    const gets = axiosPrivate.calls("get");
    expect(gets[gets.length - 1].url).toBe("/test-project/chat/conversations/group-1/preview");
  });

  it("creates a group with an avatar as multipart avatarFile + avatarFile.options", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversations(),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", listPage([])),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const group = makeConversation({ id: "group-1", type: "group", name: "Team" });
    axiosPrivate.mockResponse("post", group, 201);
    axiosPrivate.mockResponse("get", makeConversationPreview({ id: "group-1", type: "group" }));

    const file = new File(["bytes"], "a.png", { type: "image/png" });
    const options = { mode: "original-aspect" as const, sizes: { small: 64 } };
    let returned;
    await act(async () => {
      returned = await result.current.createGroup({
        name: "Team",
        memberIds: ["user-2", "user-3"],
        metadata: { topic: "launch" },
        avatarFile: { file, options },
      });
    });

    expect(returned).toEqual(group);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/chat/conversations");
    expect(call.body).toBeInstanceOf(FormData);
    expect(call.config?.headers).toMatchObject({ "Content-Type": "multipart/form-data" });
    const formData = call.body as FormData;
    expect(formData.get("type")).toBe("group");
    expect(formData.get("name")).toBe("Team");
    expect(formData.get("memberIds")).toBe(JSON.stringify(["user-2", "user-3"]));
    expect(formData.get("metadata")).toBe(JSON.stringify({ topic: "launch" }));
    expect(formData.get("avatarFile")).toBeInstanceOf(File);
    expect(formData.get("avatarFile.options")).toBe(JSON.stringify(options));
    expect(formData.has("description")).toBe(false);
  });

  it("still resolves to the created group when its preview fetch fails", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useConversations(),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", listPage([])),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const group = makeConversation({ id: "group-1", type: "group" });
    axiosPrivate.mockResponse("post", group, 201);
    axiosPrivate.mockError("get", 500);

    let returned;
    await act(async () => {
      returned = await result.current.createGroup({ name: "Team" });
    });

    expect(returned).toEqual(group);
    expect(result.current.conversations).toEqual([]);
  });

  // ── Reconnect reconciliation ────────────────────────────────────────────────
  // `socketConnected` is written to the store by ChatProvider from the socket's
  // own connect/disconnect events; here it is dispatched directly.
  describe("reconnect refresh", () => {
    function renderWithStore(props: UseConversationsProps = {}, { connectedAtMount = false } = {}) {
      const { Wrapper, store, axiosPrivate } = makeProvidersWrapper({
        accessToken: "token-1",
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", listPage([
              makeConversationPreview({
                id: "conversation-1",
                lastMessageAt: "2024-01-02T00:00:00.000Z",
                createdAt: "2024-01-01T00:00:00.000Z",
              }),
            ], "cursor-6")),
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
      axiosPrivate.mockResponse("get", listPage([makeConversationPreview({ id: "conversation-2" })]));
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
      axiosPrivate.mockResponse("get", listPage([fresh, makeConversationPreview({ id: "conversation-1" })], "cursor-8"));
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
        axiosPrivate.mockResponse("get", listPage([]));
        act(() => {
          store.dispatch(setSocketConnected(true));
        });
        await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(n));
        expect(axiosPrivate.calls("get")[n - 1].config?.params).toEqual({ limit: "20" });
      }
    });
  });
});
