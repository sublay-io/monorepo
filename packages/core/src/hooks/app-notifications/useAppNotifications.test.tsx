import { describe, it, expect, beforeEach, afterEach } from "vitest";
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

  it("loadMore advances the page, which triggers a fetch for page 2", async () => {
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

    act(() => result.current.loadMore());

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

    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ markedAsRead: 1 }));
    await act(async () => {
      await result.current.markAllNotificationsAsRead();
    });
    expect(result.current.unreadAppNotificationsCount).toBe(0);
  });

  it("resetAppNotifications is exposed and re-fetches page 1", async () => {
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
      await result.current.resetAppNotifications();
    });

    expect(result.current.appNotifications.map((n) => n.id)).toEqual(["n-refreshed"]);
  });
});
