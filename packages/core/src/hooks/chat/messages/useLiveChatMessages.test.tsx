import { describe, it, expect, afterEach, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeChatMessage } from "../../../test-utils";
import useLiveChatMessages from "./useLiveChatMessages";
import { setThreadReplies, upsertMessage } from "../../../store/slices/chatSlice";

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
            messages: [newer, older],
            hasMore: true,
            oldestCreatedAt: older.createdAt,
            newestCreatedAt: newer.createdAt,
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

  it("forwards includeGrants to the request, composing it with includeFiles", async () => {
    // Without this the canonical conversation surface can never load existing
    // grants — `message:grant` only covers grants issued while it's open.
    const { result, axiosPrivate } = renderHookWithAxios(
      () =>
        useLiveChatMessages({
          conversationId: "conversation-1",
          includeFiles: true,
          includeGrants: true,
        }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            messages: [],
            hasMore: false,
            oldestCreatedAt: null,
            newestCreatedAt: null,
          }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params.include).toBe("files,grants");
  });

  it("refetches when includeGrants or includeFiles flips on a mounted hook", async () => {
    // The initial-fetch effect deliberately lists the two include flags: they
    // change what a message row CONTAINS, so a caller toggling one on a
    // mounted conversation must get a fresh page rather than silence.
    const page = {
      messages: [],
      hasMore: false,
      oldestCreatedAt: null,
      newestCreatedAt: null,
    };

    const { result, axiosPrivate, rerender } = renderHookWithAxios(
      ({
        includeFiles,
        includeGrants,
      }: {
        includeFiles: boolean;
        includeGrants: boolean;
      }) =>
        useLiveChatMessages({
          conversationId: "conversation-1",
          includeFiles,
          includeGrants,
        }),
      {
        initialProps: { includeFiles: false, includeGrants: false },
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", page),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(axiosPrivate.calls("get")).toHaveLength(1);
    expect(axiosPrivate.calls("get")[0].config?.params.include).toBeUndefined();

    axiosPrivate.mockResponse("get", page);
    rerender({ includeFiles: false, includeGrants: true });

    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(2));
    expect(axiosPrivate.calls("get")[1].config?.params.include).toBe("grants");

    axiosPrivate.mockResponse("get", page);
    rerender({ includeFiles: true, includeGrants: true });

    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(3));
    expect(axiosPrivate.calls("get")[2].config?.params.include).toBe(
      "files,grants",
    );

    // A re-render that changes neither flag must NOT re-arm the effect — the
    // deps are primitives precisely so this cannot loop.
    rerender({ includeFiles: true, includeGrants: true });
    rerender({ includeFiles: true, includeGrants: true });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(axiosPrivate.calls("get")).toHaveLength(3);
  });

  it("omits include when includeGrants is not requested", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useLiveChatMessages({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            messages: [],
            hasMore: false,
            oldestCreatedAt: null,
            newestCreatedAt: null,
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
            messages: [reply],
            hasMore: false,
            oldestCreatedAt: reply.createdAt,
            newestCreatedAt: reply.createdAt,
          }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages).toEqual([reply]);
    expect(result.current.hasMore).toBe(false);

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toMatchObject({ sortDir: "asc", parentMessageId: "message-1" });
  });

  it("thread loadOlder pages from the newest fetched reply, not a live reply beyond a gap", async () => {
    const reply = (id: string, createdAt: string) =>
      makeChatMessage({ id, conversationId: "conversation-1", parentMessageId: "message-1", createdAt });

    const { result, store, axiosPrivate } = renderHookWithAxios(
      () => useLiveChatMessages({ conversationId: "conversation-1", parentMessageId: "message-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            messages: [reply("reply-1", "2024-01-01T00:00:01.000Z")],
            hasMore: true,
            oldestCreatedAt: "2024-01-01T00:00:01.000Z",
            newestCreatedAt: "2024-01-01T00:00:01.000Z",
          }),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    // A live reply lands past the replies not loaded yet.
    act(() => {
      store.dispatch(upsertMessage(reply("reply-9", "2024-01-01T00:00:09.000Z")));
    });

    axiosPrivate.mockResponse("get", {
      messages: [reply("reply-2", "2024-01-01T00:00:02.000Z")],
      hasMore: false,
      oldestCreatedAt: "2024-01-01T00:00:02.000Z",
      newestCreatedAt: "2024-01-01T00:00:02.000Z",
    });
    await act(async () => {
      await result.current.loadOlder();
    });

    expect(axiosPrivate.calls("get")[1].config?.params.after).toBe("2024-01-01T00:00:01.000Z");
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
          axiosPrivate.mockResponse("get", { messages: [], hasMore: false, oldestCreatedAt: null, newestCreatedAt: null }),
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
          messages: [reply("reply-1", "2024-01-01T00:00:01.000Z"), reply("reply-2", "2024-01-01T00:00:02.000Z")],
          hasMore: true,
          oldestCreatedAt: "2024-01-01T00:00:01.000Z",
          newestCreatedAt: "2024-01-01T00:00:02.000Z",
        },
      });
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockResponse("get", {
      messages: [reply("reply-3", "2024-01-01T00:00:03.000Z")],
      hasMore: false,
      oldestCreatedAt: "2024-01-01T00:00:03.000Z",
      newestCreatedAt: "2024-01-01T00:00:03.000Z",
    });
    await act(async () => {
      await result.current.loadOlder();
    });

    expect(axiosPrivate.calls("get")[2].config?.params.after).toBe("2024-01-01T00:00:02.000Z");
    expect(result.current.messages.map((m) => m.id)).toEqual(["reply-1", "reply-2", "reply-3", "reply-9"]);
  });

  it("loadOlder fetches using the oldest loaded message as the before cursor", async () => {
    const oldest = makeChatMessage({ id: "message-1", createdAt: "2024-01-02T00:00:00.000Z" });
    const evenOlder = makeChatMessage({ id: "message-0", createdAt: "2024-01-01T00:00:00.000Z" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useLiveChatMessages({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            messages: [oldest],
            hasMore: true,
            oldestCreatedAt: oldest.createdAt,
            newestCreatedAt: oldest.createdAt,
          }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockResponse("get", {
      messages: [evenOlder],
      hasMore: false,
      oldestCreatedAt: evenOlder.createdAt,
      newestCreatedAt: evenOlder.createdAt,
    });

    await act(async () => {
      await result.current.loadOlder();
    });

    expect(result.current.messages.map((m) => m.id)).toEqual(["message-0", "message-1"]);
    expect(result.current.hasMore).toBe(false);

    const calls = axiosPrivate.calls("get");
    expect(calls[1].config?.params).toMatchObject({ before: oldest.createdAt });
  });

  it("loadOlder is a no-op when there is no more data", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useLiveChatMessages({ conversationId: "conversation-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            messages: [],
            hasMore: false,
            oldestCreatedAt: null,
            newestCreatedAt: null,
          }),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadOlder();
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
