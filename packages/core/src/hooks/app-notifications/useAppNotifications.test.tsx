import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, cleanup, waitFor } from "@testing-library/react";

import {
  renderHookWithStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  makeAuthUser,
  type FetchMockHandle,
} from "../../test-utils";
import { setUser } from "../../store/slices/authSlice";
import useAppNotifications from "./useAppNotifications";

let fetchHandle: FetchMockHandle;

const notification = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  userId: "user-1",
  type: "system",
  isRead: false,
  metadata: { title: undefined, content: undefined, buttonData: null },
  createdAt: "2024-01-01T00:00:00.000Z",
  action: "view",
  ...overrides,
});

function defaultResponder(...args: unknown[]) {
  const req = args[0] as Request | string;
  const url = typeof req === "string" ? req : req.url;
  const method =
    (typeof req === "string"
      ? (args[1] as RequestInit | undefined)?.method
      : (req as Request).method) ?? "GET";

  if (method === "GET" && url.includes("/app-notifications/unread-count")) {
    return jsonResponse({ count: 2 });
  }
  if (method === "GET" && url.includes("/app-notifications")) {
    return jsonResponse({
      data: [notification("n1")],
      pagination: { page: 1, pageSize: 10, totalPages: 1, totalItems: 1, hasMore: false },
    });
  }
  return jsonResponse({}, 404);
}

beforeEach(() => {
  fetchHandle = stubFetchMock(async (...args: unknown[]) => defaultResponder(...args));
});

afterEach(() => {
  cleanup();
  unstubFetchMock();
});

describe("useAppNotifications", () => {
  it("fetches the unread count and first page once a user is present", async () => {
    const { result, store } = renderHookWithStore(() => useAppNotifications(), {
      projectId: "test-project",
    });
    act(() => store.dispatch(setUser(makeAuthUser())));

    await waitFor(() => expect(result.current.appNotifications).toHaveLength(1));
    expect(result.current.unreadAppNotificationsCount).toBe(2);
    expect(result.current.hasMore).toBe(false);
  });

  it("does not fetch anything while there is no user", async () => {
    renderHookWithStore(() => useAppNotifications(), { projectId: "test-project" });

    await new Promise((r) => setTimeout(r, 10));
    expect(fetchHandle.calls()).toHaveLength(0);
  });

  it("applies the default system template to derive title/content", async () => {
    fetchHandle.fetchMock.mockImplementation(async (...args: unknown[]) => {
      const req = args[0] as Request | string;
      const url = typeof req === "string" ? req : req.url;
      if (url.includes("/app-notifications/unread-count")) return jsonResponse({ count: 0 });
      if (url.includes("/app-notifications")) {
        return jsonResponse({
          data: [notification("n1", { metadata: { title: "Custom title", content: "Custom body", buttonData: null } })],
          pagination: { page: 1, pageSize: 10, totalPages: 1, totalItems: 1, hasMore: false },
        });
      }
      return jsonResponse({}, 404);
    });

    const { result, store } = renderHookWithStore(() => useAppNotifications(), {
      projectId: "test-project",
    });
    act(() => store.dispatch(setUser(makeAuthUser())));

    await waitFor(() => expect(result.current.appNotifications).toHaveLength(1));
    expect(result.current.appNotifications[0]).toMatchObject({
      title: "Custom title",
      content: "Custom body",
    });
  });

  it("loadMore fetches page 2", async () => {
    // Page-aware (rather than one-shot) responses, since the user-fallback sync in
    // useUser() can cause this hook's reset effect to legitimately re-run once;
    // a one-shot mock would then be consumed out of order.
    fetchHandle.fetchMock.mockImplementation(async (...args: unknown[]) => {
      const req = args[0] as Request | string;
      const url = typeof req === "string" ? req : req.url;
      if (url.includes("/app-notifications/unread-count")) return jsonResponse({ count: 0 });
      if (url.includes("/app-notifications")) {
        const page = new URL(url).searchParams.get("page");
        if (page === "2") {
          return jsonResponse({
            data: [notification("n2")],
            pagination: { page: 2, pageSize: 1, totalPages: 2, totalItems: 2, hasMore: false },
          });
        }
        return jsonResponse({
          data: [notification("n1")],
          pagination: { page: 1, pageSize: 1, totalPages: 2, totalItems: 2, hasMore: true },
        });
      }
      return jsonResponse({}, 404);
    });

    const { result, store } = renderHookWithStore(() => useAppNotifications({ limit: 1 }), {
      projectId: "test-project",
    });
    act(() => store.dispatch(setUser(makeAuthUser())));
    await waitFor(() => expect(result.current.appNotifications).toHaveLength(1));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() =>
      expect(
        fetchHandle.calls().some((c) => new URL(c.url).searchParams.get("page") === "2"),
      ).toBe(true),
    );
  });

  it("markNotificationAsRead and markAllNotificationsAsRead delegate through to the actions layer", async () => {
    const { result, store } = renderHookWithStore(() => useAppNotifications(), {
      projectId: "test-project",
    });
    act(() => store.dispatch(setUser(makeAuthUser())));
    await waitFor(() => expect(result.current.appNotifications).toHaveLength(1));

    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({}));
    await act(async () => {
      await result.current.markNotificationAsRead({ notificationId: "n1" });
    });
    expect(result.current.appNotifications[0].isRead).toBe(true);

    fetchHandle.fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await act(async () => {
      await result.current.markAllNotificationsAsRead();
    });
    expect(result.current.unreadAppNotificationsCount).toBe(0);
  });

  it("refetch is exposed and re-fetches page 1", async () => {
    const { result, store } = renderHookWithStore(() => useAppNotifications(), {
      projectId: "test-project",
    });
    act(() => store.dispatch(setUser(makeAuthUser())));
    await waitFor(() => expect(result.current.appNotifications).toHaveLength(1));

    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: [notification("n-refreshed")],
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalItems: 1, hasMore: false },
      }),
    );
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.appNotifications.map((n) => n.id)).toEqual(["n-refreshed"]);
  });
});

describe("useAppNotifications — the list contract", () => {
  type Reply = Response | Promise<Response>;
  /** List requests are answered from `replies` in order (then a last page); other GETs as usual. */
  function route(replies: Array<() => Reply>) {
    fetchHandle.fetchMock.mockImplementation(async (...args: unknown[]) => {
      const req = args[0] as Request | string;
      const url = typeof req === "string" ? req : req.url;
      if (url.includes("/app-notifications/unread-count")) return jsonResponse({ count: 0 });
      if (url.includes("/app-notifications")) {
        const next = replies.shift();
        return next ? next() : listPage([], false);
      }
      return jsonResponse({}, 404);
    });
  }
  function listPage(ids: string[], hasMore: boolean) {
    return jsonResponse({
      data: ids.map((id) => notification(id)),
      pagination: { page: 1, pageSize: 1, totalPages: 1, totalItems: ids.length, hasMore },
    });
  }
  const listUrls = () =>
    fetchHandle
      .calls()
      .map((c) => new URL(c.url))
      .filter((u) => /\/app-notifications$/.test(u.pathname));

  afterEach(() => vi.restoreAllMocks());

  it("retries a failed first page as page 1", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    route([() => jsonResponse({ message: "boom" }, 500), () => listPage(["n1"], true)]);
    const { result, store } = renderHookWithStore(() => useAppNotifications({ limit: 1 }));
    act(() => store.dispatch(setUser(makeAuthUser())));
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.appNotifications.map((n) => n.id)).toEqual(["n1"]);
    expect(listUrls().map((u) => u.searchParams.get("page"))).toEqual(["1", "1"]);
  });

  it("drops a page that lands after a refetch started", async () => {
    let release!: (r: Response) => void;
    route([
      () => listPage(["n1"], true),
      () => new Promise<Response>((r) => { release = r; }),
      () => listPage(["fresh"], true),
    ]);
    const { result, store } = renderHookWithStore(() => useAppNotifications({ limit: 1 }));
    act(() => store.dispatch(setUser(makeAuthUser())));
    await waitFor(() => expect(result.current.appNotifications.map((n) => n.id)).toEqual(["n1"]));

    act(() => {
      result.current.loadMore();
    });
    await waitFor(() => expect(listUrls()).toHaveLength(2));
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.appNotifications.map((n) => n.id)).toEqual(["fresh"]);

    await act(async () => {
      release(await listPage(["stale-2"], false));
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(result.current.appNotifications.map((n) => n.id)).toEqual(["fresh"]);
    expect(result.current.hasMore).toBe(true);
  });

  it("two loadMore calls in the same tick make one request", async () => {
    route([() => listPage(["n1"], true), () => listPage(["n2"], true)]);
    const { result, store } = renderHookWithStore(() => useAppNotifications({ limit: 1 }));
    act(() => store.dispatch(setUser(makeAuthUser())));
    await waitFor(() => expect(result.current.appNotifications).toHaveLength(1));

    await act(async () => {
      await Promise.all([result.current.loadMore(), result.current.loadMore()]);
    });
    expect(listUrls().map((u) => u.searchParams.get("page"))).toEqual(["1", "2"]);
    expect(result.current.appNotifications.map((n) => n.id)).toEqual(["n1", "n2"]);
  });

  it("a limit change after mount reloads page 1 at the new size", async () => {
    route([() => listPage(["n1"], true), () => listPage(["n1", "n2"], true)]);
    const { result, store, rerender } = renderHookWithStore(
      ({ limit }: { limit: number }) => useAppNotifications({ limit }),
      { initialProps: { limit: 1 } },
    );
    act(() => store.dispatch(setUser(makeAuthUser())));
    await waitFor(() => expect(result.current.appNotifications).toHaveLength(1));
    expect(listUrls()).toHaveLength(1);

    rerender({ limit: 2 });
    await waitFor(() => expect(result.current.appNotifications).toHaveLength(2));
    const last = listUrls()[listUrls().length - 1].searchParams;
    expect(listUrls()).toHaveLength(2);
    expect(last.get("page")).toBe("1");
    expect(last.get("limit")).toBe("2");
  });
});
