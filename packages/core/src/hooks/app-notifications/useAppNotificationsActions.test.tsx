import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, cleanup } from "@testing-library/react";

import {
  renderHookWithStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  makeAuthUser,
  type FetchMockHandle,
} from "../../test-utils";
import { setUser } from "../../store/slices/authSlice";
import { useAppNotificationsActions } from "./useAppNotificationsActions";
import {
  addNotifications,
  setUnreadCount,
  selectAppNotifications,
  selectAppNotificationsLoading,
  selectAppNotificationsPage,
  selectUnreadCount,
} from "../../store/slices/appNotificationsSlice";

let fetchHandle: FetchMockHandle;

const NOTIFICATION = {
  id: "n1",
  userId: "user-1",
  type: "system",
  isRead: false,
  metadata: { buttonData: null },
  createdAt: "2024-01-01T00:00:00.000Z",
  action: "view",
};

// Two unread notifications and one read one in the slice, with an unread count
// that also covers notifications on pages not loaded yet.
function seedNotifications(store: { dispatch: (action: any) => unknown }) {
  store.dispatch(
    addNotifications({
      notifications: [
        { ...NOTIFICATION, id: "n1", isRead: false },
        { ...NOTIFICATION, id: "n2", isRead: false },
        { ...NOTIFICATION, id: "n3", isRead: true },
      ] as any,
      hasMore: true,
      isFirstPage: true,
    }),
  );
  store.dispatch(setUnreadCount(5));
}

beforeEach(() => {
  fetchHandle = stubFetchMock(async () => jsonResponse({}, 404));
});

afterEach(() => {
  cleanup();
  unstubFetchMock();
});

describe("useAppNotificationsActions", () => {
  it("loadMore dispatches the slice's page increment", () => {
    const { result, store } = renderHookWithStore(() => useAppNotificationsActions(), {
      projectId: "test-project",
    });
    act(() => result.current.loadMore());
    expect(selectAppNotificationsPage(store.getState())).toBe(2);
  });

  describe("markNotificationAsRead", () => {
    it("optimistically marks read locally, then calls the API", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({}));
      const { result, store } = renderHookWithStore(
        () => useAppNotificationsActions(),
        { projectId: "test-project" },
      );
      act(() => store.dispatch(setUser(makeAuthUser())));

      await act(async () => {
        await result.current.markNotificationAsRead({ notificationId: "n1" });
      });

      const patchCall = fetchHandle.calls().find((c) => c.method === "PATCH");
      expect(patchCall?.url).toContain("/test-project/app-notifications/n1/mark-as-read");
    });

    it("throws when there is no authenticated user", async () => {
      const { result } = renderHookWithStore(() => useAppNotificationsActions(), {
        projectId: "test-project",
      });

      await expect(
        result.current.markNotificationAsRead({ notificationId: "n1" }),
      ).rejects.toThrow("No project ID or authenticated user available");
    });

    it("re-throws on a failed request", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      const { result, store } = renderHookWithStore(
        () => useAppNotificationsActions(),
        { projectId: "test-project" },
      );
      act(() => store.dispatch(setUser(makeAuthUser())));

      await expect(
        result.current.markNotificationAsRead({ notificationId: "n1" }),
      ).rejects.toBeTruthy();
    });

    // Not wrapped in act(): act drops the catch block's dispatch on a reject.
    it("puts the notification back to unread when the request fails", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      const { result, store } = renderHookWithStore(
        () => useAppNotificationsActions(),
        { projectId: "test-project" },
      );
      act(() => {
        store.dispatch(setUser(makeAuthUser()));
        seedNotifications(store);
      });

      await expect(
        result.current.markNotificationAsRead({ notificationId: "n1" }),
      ).rejects.toBeTruthy();

      expect(selectAppNotifications(store.getState()).map((n) => n.isRead)).toEqual([
        false,
        false,
        true,
      ]);
      expect(selectUnreadCount(store.getState())).toBe(5);
    });

    it("leaves an already-read notification read when the request fails", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      const { result, store } = renderHookWithStore(
        () => useAppNotificationsActions(),
        { projectId: "test-project" },
      );
      act(() => {
        store.dispatch(setUser(makeAuthUser()));
        seedNotifications(store);
      });

      await expect(
        result.current.markNotificationAsRead({ notificationId: "n3" }),
      ).rejects.toBeTruthy();

      expect(selectAppNotifications(store.getState())[2].isRead).toBe(true);
      expect(selectUnreadCount(store.getState())).toBe(5);
    });
  });

  describe("resetAppNotifications", () => {
    it("resets then loads page 1, marking isFirstPage", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({
          data: [NOTIFICATION],
          pagination: { page: 1, pageSize: 10, totalPages: 1, totalItems: 1, hasMore: false },
        }),
      );
      const { result, store } = renderHookWithStore(
        () => useAppNotificationsActions(),
        { projectId: "test-project" },
      );
      act(() => store.dispatch(setUser(makeAuthUser())));

      await act(async () => {
        await result.current.resetAppNotifications();
      });

      expect(selectAppNotifications(store.getState())).toHaveLength(1);
      const url = new URL(fetchHandle.calls()[0].url);
      expect(url.searchParams.get("page")).toBe("1");
    });

    it("throws when there is no authenticated user", async () => {
      const { result } = renderHookWithStore(() => useAppNotificationsActions(), {
        projectId: "test-project",
      });

      await expect(result.current.resetAppNotifications()).rejects.toThrow(
        "No project ID or authenticated user available",
      );
    });
  });

  describe("fetchMoreNotifications", () => {
    it("appends the requested page and toggles loading", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({
          data: [NOTIFICATION],
          pagination: { page: 2, pageSize: 10, totalPages: 2, totalItems: 11, hasMore: false },
        }),
      );
      const { result, store } = renderHookWithStore(
        () => useAppNotificationsActions(),
        { projectId: "test-project" },
      );
      act(() => store.dispatch(setUser(makeAuthUser())));

      await act(async () => {
        await result.current.fetchMoreNotifications({ pageToFetch: 2 });
      });

      expect(selectAppNotifications(store.getState())).toHaveLength(1);
      expect(selectAppNotificationsLoading(store.getState())).toBe(false);
    });

    it("is a silent no-op without an authenticated user", async () => {
      const { result } = renderHookWithStore(() => useAppNotificationsActions(), {
        projectId: "test-project",
      });

      await act(async () => {
        await result.current.fetchMoreNotifications({ pageToFetch: 2 });
      });

      expect(fetchHandle.calls()).toHaveLength(0);
    });
  });

  describe("updateUnreadCount", () => {
    it("stores the fetched unread count", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse(7));
      const { result, store } = renderHookWithStore(
        () => useAppNotificationsActions(),
        { projectId: "test-project" },
      );
      act(() => store.dispatch(setUser(makeAuthUser())));

      await act(async () => {
        await result.current.updateUnreadCount();
      });

      expect(selectUnreadCount(store.getState())).toBe(7);
    });

    it("swallows the error and leaves the count untouched on failure", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      const { result, store } = renderHookWithStore(
        () => useAppNotificationsActions(),
        { projectId: "test-project" },
      );
      act(() => store.dispatch(setUser(makeAuthUser())));

      await act(async () => {
        await result.current.updateUnreadCount();
      });

      expect(selectUnreadCount(store.getState())).toBe(0);
    });
  });

  describe("markAllNotificationsAsRead", () => {
    it("optimistically marks all read locally, then calls the API", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ markedAsRead: 2 }));
      const { result, store } = renderHookWithStore(
        () => useAppNotificationsActions(),
        { projectId: "test-project" },
      );
      act(() => store.dispatch(setUser(makeAuthUser())));

      await act(async () => {
        await result.current.markAllNotificationsAsRead();
      });

      const patchCall = fetchHandle.calls().find((c) => c.method === "PATCH");
      expect(patchCall?.url).toContain("/test-project/app-notifications/mark-all-as-read");
    });

    // Not wrapped in act(): act drops the catch block's dispatch on a reject.
    it("restores the unread notifications and count when the request fails", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      const { result, store } = renderHookWithStore(
        () => useAppNotificationsActions(),
        { projectId: "test-project" },
      );
      act(() => {
        store.dispatch(setUser(makeAuthUser()));
        seedNotifications(store);
      });

      await expect(result.current.markAllNotificationsAsRead()).rejects.toBeTruthy();

      expect(selectAppNotifications(store.getState()).map((n) => n.isRead)).toEqual([
        false,
        false,
        true,
      ]);
      expect(selectUnreadCount(store.getState())).toBe(5);
    });

    it("throws when there is no authenticated user", async () => {
      const { result } = renderHookWithStore(() => useAppNotificationsActions(), {
        projectId: "test-project",
      });

      await expect(result.current.markAllNotificationsAsRead()).rejects.toThrow(
        "No project ID or authenticated user available",
      );
    });
  });
});
