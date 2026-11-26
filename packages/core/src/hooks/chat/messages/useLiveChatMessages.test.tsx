import { describe, it, expect, afterEach, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeChatMessage } from "../../../test-utils";
import useLiveChatMessages from "./useLiveChatMessages";
import { axiosPrivate as axiosPrivateInstance } from "../../../config/axios";
import { okAxiosResponse, axiosErrorWithStatus } from "../../../test-utils";
import type { ChatMessageListIncludeParam } from "../../../interfaces/models/ChatMessage";
import { addOptimisticMessage, setThreadReplies, upsertMessage } from "../../../store/slices/chatSlice";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

afterEach(() => {
  resetAxiosMocks();
});

describe("useLiveChatMessages", () => {
  it("fetches the main stream on mount and stores messages ascending (oldest first)", async () => {
    const older = makeChatMessage({ id: "message-1", createdAt: "2024-01-01T00:00:00.000Z" });
    const newer = makeChatMessage({ id: "message-2", createdAt: "2024-01-02T00:00:00.000Z" });

    // Server returns DESC (newest first)
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useLiveChatMessages({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            data: [newer, older],
            pagination: { hasMore: true },
          }),
      },
    );

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Store keeps ASC order regardless of the server's DESC response
    expect(result.current.messages.map((m) => m.id)).toEqual(["message-1", "message-2"]);
    expect(result.current.hasMore).toBe(true);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/chat/conversations/conversation-1/messages");
    expect(call.config?.params).toMatchObject({ sortDir: "desc", limit: 50 });
  });

  it("forwards include to the request, joining an array", async () => {
    // Without this the canonical conversation surface can never load existing
    // grants — `message:grant` only covers grants issued while it's open.
    const { result, axiosPrivate } = renderHookWithAxios(
      () =>
        useLiveChatMessages({
          conversationId: "conversation-1",
          include: ["files", "grants"],
        }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            data: [],
            pagination: { hasMore: false },
          }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params.include).toBe("files,grants");
  });

  it("refetches when include changes on a mounted hook", async () => {
    // The initial-fetch effect deliberately lists `include`: it changes what a
    // message row CONTAINS, so a caller changing it on a mounted conversation
    // must get a fresh page rather than silence.
    const page = {
      data: [],
      pagination: { hasMore: false },
    };

    const { result, axiosPrivate, rerender } = renderHookWithAxios(
      ({ include }: { include?: ChatMessageListIncludeParam }) =>
        useLiveChatMessages({
          conversationId: "conversation-1",
          include,
        }),
      {
        initialProps: {} as { include?: ChatMessageListIncludeParam },
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", page),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(axiosPrivate.calls("get")).toHaveLength(1);
    expect(axiosPrivate.calls("get")[0].config?.params.include).toBeUndefined();

    axiosPrivate.mockResponse("get", page);
    rerender({ include: "grants" });

    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(2));
    expect(axiosPrivate.calls("get")[1].config?.params.include).toBe("grants");

    axiosPrivate.mockResponse("get", page);
    rerender({ include: ["files", "grants"] });

    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(3));
    expect(axiosPrivate.calls("get")[2].config?.params.include).toBe(
      "files,grants",
    );

    // A re-render with a fresh array of the same values must NOT re-arm the
    // effect — it keys on the joined string precisely so this cannot loop.
    rerender({ include: ["files", "grants"] });
    rerender({ include: ["files", "grants"] });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(axiosPrivate.calls("get")).toHaveLength(3);
  });

  it("omits include when it isn't given", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useLiveChatMessages({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            data: [],
            pagination: { hasMore: false },
          }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).not.toHaveProperty("include");
  });

  it("fetches thread replies in ascending order when parentMessageId is provided", async () => {
    const reply = makeChatMessage({
      id: "reply-1",
      parentMessageId: "message-1",
      createdAt: "2024-01-01T00:00:00.000Z",
    });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useLiveChatMessages({ conversationId: "conversation-1", parentMessageId: "message-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            data: [reply],
            pagination: { hasMore: false },
          }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages).toEqual([reply]);
    expect(result.current.hasMore).toBe(false);

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toMatchObject({ sortDir: "asc", parentMessageId: "message-1" });
  });

  it("thread loadMore pages from the newest fetched reply, not a live reply beyond a gap", async () => {
    const reply = (id: string, createdAt: string) =>
      makeChatMessage({ id, conversationId: "conversation-1", parentMessageId: "message-1", createdAt });

    const { result, store, axiosPrivate } = renderHookWithAxios(
      () => useLiveChatMessages({ conversationId: "conversation-1", parentMessageId: "message-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            data: [reply("reply-1", "2024-01-01T00:00:01.000Z")],
            pagination: { hasMore: true },
          }),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    // A live reply lands past the replies not loaded yet.
    act(() => {
      store.dispatch(upsertMessage(reply("reply-9", "2024-01-01T00:00:09.000Z")));
    });

    axiosPrivate.mockResponse("get", {
      data: [reply("reply-2", "2024-01-01T00:00:02.000Z")],
      pagination: { hasMore: false },
    });
    await act(async () => {
      await result.current.loadMore();
    });

    expect(axiosPrivate.calls("get")[1].config?.params.after).toBe("reply-1");
    expect(result.current.messages.map((m) => m.id)).toEqual(["reply-1", "reply-2", "reply-9"]);
    expect(result.current.hasMore).toBe(false);
  });

  it("reopening a kept thread pages on from its first page, not from a cursor that jumped a gap", async () => {
    const reply = (id: string, createdAt: string) =>
      makeChatMessage({ id, conversationId: "conversation-1", parentMessageId: "message-1", createdAt });
    const firstPage = deferred<{ data: unknown }>();

    // Mounted on another thread first, so the kept bucket can be seeded before
    // message-1's thread opens.
    const { result, store, axiosPrivate, rerender } = renderHookWithAxios(
      ({ parentMessageId }: { parentMessageId: string }) =>
        useLiveChatMessages({ conversationId: "conversation-1", parentMessageId }),
      {
        initialProps: { parentMessageId: "message-0" },
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", { data: [], pagination: { hasMore: false } }),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Kept from an earlier open: read to the end, then reply-9 arrived live and
    // moved the cursor past replies missed while the thread was closed.
    act(() => {
      store.dispatch(
        setThreadReplies({
          parentMessageId: "message-1",
          messages: [reply("reply-1", "2024-01-01T00:00:01.000Z"), reply("reply-9", "2024-01-01T00:00:09.000Z")],
          hasMore: false,
        }),
      );
    });

    // Reopen; the first page lands only when released.
    vi.mocked(axiosPrivate.instance.get).mockReturnValueOnce(firstPage.promise as never);
    rerender({ parentMessageId: "message-1" });

    await act(async () => {
      firstPage.resolve({
        data: {
          data: [reply("reply-1", "2024-01-01T00:00:01.000Z"), reply("reply-2", "2024-01-01T00:00:02.000Z")],
          pagination: { hasMore: true },
        },
      });
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockResponse("get", {
      data: [reply("reply-3", "2024-01-01T00:00:03.000Z")],
      pagination: { hasMore: false },
    });
    await act(async () => {
      await result.current.loadMore();
    });

    expect(axiosPrivate.calls("get")[2].config?.params.after).toBe("reply-2");
    expect(result.current.messages.map((m) => m.id)).toEqual(["reply-1", "reply-2", "reply-3", "reply-9"]);
  });

  it("loadMore fetches using the oldest loaded message as the before cursor", async () => {
    const oldest = makeChatMessage({ id: "message-1", createdAt: "2024-01-02T00:00:00.000Z" });
    const evenOlder = makeChatMessage({ id: "message-0", createdAt: "2024-01-01T00:00:00.000Z" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useLiveChatMessages({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            data: [oldest],
            pagination: { hasMore: true },
          }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockResponse("get", {
      data: [evenOlder],
      pagination: { hasMore: false },
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.messages.map((m) => m.id)).toEqual(["message-0", "message-1"]);
    expect(result.current.hasMore).toBe(false);

    const calls = axiosPrivate.calls("get");
    expect(calls[1].config?.params).toMatchObject({ before: oldest.id });
  });

  it("loadMore never pages from an optimistic message", async () => {
    // Only an optimistic send is held, yet the server says there is history.
    const { result, store, axiosPrivate } = renderHookWithAxios(
      () => useLiveChatMessages({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", { data: [], pagination: { hasMore: true } }),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      store.dispatch(
        addOptimisticMessage(
          makeChatMessage({
            id: "temp-abc",
            localId: "abc",
            conversationId: "conversation-1",
            createdAt: "2024-01-01T00:00:05.000Z",
          }),
        ),
      );
    });
    await act(async () => {
      await result.current.loadMore();
    });

    expect(axiosPrivate.calls("get")).toHaveLength(1);
  });

  it("loadMore is a no-op when there is no more data", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useLiveChatMessages({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            data: [],
            pagination: { hasMore: false },
          }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(axiosPrivate.calls("get")).toHaveLength(1);
  });

  it("does not throw and stops loading when the fetch fails", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useLiveChatMessages({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockError("get", 500, { message: "Internal error" }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages).toEqual([]);
  });
});

describe("useLiveChatMessages — refetch", () => {
  const at = (day: number) => `2024-01-${String(day).padStart(2, "0")}T00:00:00.000Z`;
  const msg = (id: string, day: number) =>
    makeChatMessage({ id, conversationId: "conversation-1", createdAt: at(day) });

  it("replaces the loaded messages with the latest page, keeping optimistic and newer live ones", async () => {
    const { result, store, axiosPrivate } = renderHookWithAxios(
      () => useLiveChatMessages({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            data: [msg("m2", 2), msg("m1", 1)],
            pagination: { hasMore: true },
          }),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      store.dispatch(
        addOptimisticMessage(
          makeChatMessage({ id: "temp-abc", localId: "abc", conversationId: "conversation-1", createdAt: at(20) }),
        ),
      );
      store.dispatch(upsertMessage(msg("live", 10)));
    });

    // The latest page (newest first): m3 and m2 again. m1 is older than it and goes.
    axiosPrivate.mockResponse("get", {
      data: [msg("m3", 3), msg("m2", 2)],
      pagination: { hasMore: true },
    });
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.messages.map((m) => m.id)).toEqual(["m2", "m3", "live", "temp-abc"]);
    expect(axiosPrivate.calls("get")[1].config?.params).not.toHaveProperty("before", expect.anything());
  });

  it("a failed refetch is retried by loadMore as a refetch (replace), not as a merge", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useLiveChatMessages({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            data: [msg("m2", 2), msg("m1", 1)],
            pagination: { hasMore: true },
          }),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockError("get", 500);
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.hasMore).toBe(true);

    // After a long gap, the latest page doesn't reach what's held.
    axiosPrivate.mockResponse("get", {
      data: [msg("m9", 9), msg("m8", 8)],
      pagination: { hasMore: true },
    });
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.error).toBeNull();
    // Replaced: no gap between m2 and m8.
    expect(result.current.messages.map((m) => m.id)).toEqual(["m8", "m9"]);
    expect(axiosPrivate.calls("get")[2].config?.params).not.toHaveProperty("before", expect.anything());
    vi.restoreAllMocks();
  });
});

describe("useLiveChatMessages — two hooks opening one conversation", () => {
  function holdTwo() {
    const releases: Array<(fn: () => unknown) => void> = [];
    for (let i = 0; i < 2; i++) {
      vi.mocked(axiosPrivateInstance.get).mockImplementationOnce(
        () =>
          new Promise((resolve, reject) => {
            releases.push((fn) => {
              try {
                resolve(fn());
              } catch (e) {
                reject(e);
              }
            });
          }) as never,
      );
    }
    return releases;
  }
  const page = (id: string) =>
    okAxiosResponse(
      { data: [makeChatMessage({ id, conversationId: "conversation-1" })], pagination: { hasMore: false } },
      200,
    );

  it("stays loading until both opens have settled", async () => {
    let releases!: ReturnType<typeof holdTwo>;
    const { result } = renderHookWithAxios(
      () => ({
        a: useLiveChatMessages({ conversationId: "conversation-1", include: "files" }),
        b: useLiveChatMessages({ conversationId: "conversation-1" }),
      }),
      { beforeRender: () => { releases = holdTwo(); } },
    );
    await waitFor(() => expect(releases).toHaveLength(2));
    expect(result.current.a.loading).toBe(true);

    await act(async () => {
      releases[0](() => page("m1"));
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.current.a.loading).toBe(true);
    expect(result.current.b.loading).toBe(true);

    await act(async () => {
      releases[1](() => page("m1"));
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.current.a.loading).toBe(false);
    expect(result.current.b.loading).toBe(false);
  });

  it("one open landing clears the error the other open left", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let releases!: ReturnType<typeof holdTwo>;
    const { result } = renderHookWithAxios(
      () => ({
        a: useLiveChatMessages({ conversationId: "conversation-1", include: "files" }),
        b: useLiveChatMessages({ conversationId: "conversation-1" }),
      }),
      { beforeRender: () => { releases = holdTwo(); } },
    );
    await waitFor(() => expect(releases).toHaveLength(2));

    await act(async () => {
      releases[0](() => { throw axiosErrorWithStatus(500, {}); });
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.current.a.error).toBeInstanceOf(Error);

    await act(async () => {
      releases[1](() => page("m1"));
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.current.a.error).toBeNull();
    expect(result.current.b.messages.map((m) => m.id)).toEqual(["m1"]);
    vi.restoreAllMocks();
  });
});
