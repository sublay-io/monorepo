import { describe, it, expect } from "vitest";

import reducer, {
  setProjectContext,
  setLimit,
  setNotificationTemplates,
  resetNotifications,
  loadMore,
  setLoading,
  addNotifications,
  markAsReadLocally,
  markAllAsReadLocally,
  revertMarkAsReadLocally,
  setUnreadCount,
  handleError,
  selectAppNotifications,
  selectUnreadCount,
  selectAppNotificationsLoading,
  selectAppNotificationsHasMore,
  selectAppNotificationsPage,
  selectAppNotificationsLimit,
  selectNotificationTemplates,
  selectCurrentProjectId,
  type AppNotificationsState,
} from "./appNotificationsSlice";
import type { UnifiedAppNotification } from "../../interfaces/models/AppNotification";

const makeNotification = (
  overrides: Partial<UnifiedAppNotification> & { id: string },
): UnifiedAppNotification =>
  ({
    userId: "user-1",
    type: "system",
    isRead: false,
    metadata: { buttonData: null },
    createdAt: "2024-01-01T00:00:00.000Z",
    action: "view",
    ...overrides,
  }) as UnifiedAppNotification;

const initial: AppNotificationsState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  hasMore: true,
  page: 1,
  limit: 10,
  notificationTemplates: undefined,
  currentProjectId: undefined,
};

describe("appNotificationsSlice", () => {
  it("setProjectContext / setLimit / setNotificationTemplates / setLoading / setUnreadCount set their fields", () => {
    let s = reducer(initial, setProjectContext("project-1"));
    expect(s.currentProjectId).toBe("project-1");
    s = reducer(s, setLimit(25));
    expect(s.limit).toBe(25);
    s = reducer(s, setNotificationTemplates({ newFollow: { title: "Custom" } }));
    expect(s.notificationTemplates).toEqual({ newFollow: { title: "Custom" } });
    s = reducer(s, setLoading(true));
    expect(s.loading).toBe(true);
    s = reducer(s, setUnreadCount(5));
    expect(s.unreadCount).toBe(5);
  });

  it("resetNotifications clears notifications/page/hasMore/loading", () => {
    let s = reducer(initial, addNotifications({
      notifications: [makeNotification({ id: "n1" })],
      hasMore: true,
      isFirstPage: true,
    }));
    s = { ...s, page: 3, loading: true };
    s = reducer(s, resetNotifications());
    expect(s.notifications).toEqual([]);
    expect(s.page).toBe(1);
    expect(s.hasMore).toBe(true);
    expect(s.loading).toBe(false);
  });

  describe("loadMore", () => {
    it("increments page when hasMore and not loading", () => {
      const s = reducer(initial, loadMore());
      expect(s.page).toBe(2);
    });

    it("is a no-op when hasMore is false", () => {
      const s = reducer({ ...initial, hasMore: false }, loadMore());
      expect(s.page).toBe(1);
    });

    it("is a no-op while loading", () => {
      const s = reducer({ ...initial, loading: true }, loadMore());
      expect(s.page).toBe(1);
    });
  });

  describe("addNotifications", () => {
    it("replaces the list on isFirstPage", () => {
      let s = reducer(initial, addNotifications({
        notifications: [makeNotification({ id: "n1" })],
        hasMore: true,
        isFirstPage: true,
      }));
      s = reducer(s, addNotifications({
        notifications: [makeNotification({ id: "n2" })],
        hasMore: false,
        isFirstPage: true,
      }));
      expect(s.notifications.map((n) => n.id)).toEqual(["n2"]);
      expect(s.hasMore).toBe(false);
      expect(s.loading).toBe(false);
    });

    it("appends and de-dupes by id on subsequent pages", () => {
      let s = reducer(initial, addNotifications({
        notifications: [makeNotification({ id: "n1" })],
        hasMore: true,
        isFirstPage: true,
      }));
      s = reducer(s, addNotifications({
        notifications: [makeNotification({ id: "n1" }), makeNotification({ id: "n2" })],
        hasMore: false,
      }));
      expect(s.notifications.map((n) => n.id)).toEqual(["n1", "n2"]);
    });
  });

  describe("markAsReadLocally", () => {
    it("marks the matching unread notification as read and decrements unreadCount", () => {
      let s = reducer(initial, addNotifications({
        notifications: [makeNotification({ id: "n1", isRead: false })],
        hasMore: false,
        isFirstPage: true,
      }));
      s = { ...s, unreadCount: 1 };
      s = reducer(s, markAsReadLocally("n1"));
      expect(s.notifications[0].isRead).toBe(true);
      expect(s.unreadCount).toBe(0);
    });

    it("does not go below 0 and is a no-op for an already-read or missing notification", () => {
      let s = reducer(initial, addNotifications({
        notifications: [makeNotification({ id: "n1", isRead: true })],
        hasMore: false,
        isFirstPage: true,
      }));
      s = reducer(s, markAsReadLocally("n1"));
      expect(s.unreadCount).toBe(0);

      s = reducer(s, markAsReadLocally("missing"));
      expect(s.unreadCount).toBe(0);
    });
  });

  it("markAllAsReadLocally marks every notification read and zeroes unreadCount", () => {
    let s = reducer(initial, addNotifications({
      notifications: [
        makeNotification({ id: "n1", isRead: false }),
        makeNotification({ id: "n2", isRead: false }),
      ],
      hasMore: false,
      isFirstPage: true,
    }));
    s = { ...s, unreadCount: 2 };
    s = reducer(s, markAllAsReadLocally());
    expect(s.notifications.every((n) => n.isRead)).toBe(true);
    expect(s.unreadCount).toBe(0);
  });

  describe("revertMarkAsReadLocally", () => {
    const seeded = () =>
      reducer(initial, addNotifications({
        notifications: [
          makeNotification({ id: "n1", isRead: true }),
          makeNotification({ id: "n2", isRead: true }),
          makeNotification({ id: "n3", isRead: true }),
        ],
        hasMore: false,
        isFirstPage: true,
      }));

    it("turns the listed notifications back to unread and counts each one", () => {
      let s = { ...seeded(), unreadCount: 4 };
      s = reducer(s, revertMarkAsReadLocally({ notificationIds: ["n1", "missing"] }));
      expect(s.notifications.map((n) => n.isRead)).toEqual([false, true, true]);
      expect(s.unreadCount).toBe(5);
    });

    it("restores the given unread count instead of counting", () => {
      let s = seeded();
      s = reducer(s, revertMarkAsReadLocally({ notificationIds: ["n1", "n2"], unreadCount: 12 }));
      expect(s.notifications.map((n) => n.isRead)).toEqual([false, false, true]);
      expect(s.unreadCount).toBe(12);
    });

    it("does not count a notification that is already unread", () => {
      let s = reducer(seeded(), revertMarkAsReadLocally({ notificationIds: ["n1"] }));
      s = reducer(s, revertMarkAsReadLocally({ notificationIds: ["n1"] }));
      expect(s.unreadCount).toBe(1);
    });
  });

  it("handleError stops loading", () => {
    const s = reducer({ ...initial, loading: true }, handleError());
    expect(s.loading).toBe(false);
  });

  describe("selectors", () => {
    it("read each field through the namespaced state", () => {
      const s: AppNotificationsState = {
        ...initial,
        notifications: [makeNotification({ id: "n1" })],
        unreadCount: 3,
        loading: true,
        hasMore: false,
        page: 2,
        limit: 25,
        notificationTemplates: { newFollow: { title: "Custom" } },
        currentProjectId: "project-1",
      };
      const state = { sublay: { appNotifications: s } } as never;

      expect(selectAppNotifications(state)).toEqual(s.notifications);
      expect(selectUnreadCount(state)).toBe(3);
      expect(selectAppNotificationsLoading(state)).toBe(true);
      expect(selectAppNotificationsHasMore(state)).toBe(false);
      expect(selectAppNotificationsPage(state)).toBe(2);
      expect(selectAppNotificationsLimit(state)).toBe(25);
      expect(selectNotificationTemplates(state)).toEqual({ newFollow: { title: "Custom" } });
      expect(selectCurrentProjectId(state)).toBe("project-1");
    });
  });
});
