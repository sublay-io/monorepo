import { describe, it, expect, beforeEach, afterEach } from "vitest";

import {
  makeRtkQueryStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
  type RtkQueryStore,
} from "../../test-utils";
import { appNotificationsApi } from "./appNotificationsApi";
import type { UnifiedAppNotification } from "../../interfaces/models/AppNotification";

let fetchHandle: FetchMockHandle;
let store: RtkQueryStore;

const NOTIFICATION = {
  id: "n1",
  userId: "user-1",
  type: "system",
  isRead: false,
  metadata: { buttonData: null },
  createdAt: "2024-01-01T00:00:00.000Z",
  action: "view",
} as unknown as UnifiedAppNotification;

beforeEach(() => {
  fetchHandle = stubFetchMock(async () => jsonResponse({}, 404));
  store = makeRtkQueryStore();
});

afterEach(() => {
  unstubFetchMock();
});

describe("appNotificationsApi", () => {
  it("fetchAppNotifications issues a GET with page/limit params", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: [NOTIFICATION],
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalItems: 1, hasMore: false },
      }),
    );

    const result = await store.dispatch(
      appNotificationsApi.endpoints.fetchAppNotifications.initiate({
        projectId: "test-project",
        page: 1,
        limit: 10,
      }),
    );

    const url = new URL(fetchHandle.calls()[0].url);
    expect(fetchHandle.calls()[0].method).toBe("GET");
    expect(url.pathname).toContain("/test-project/app-notifications");
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(result.data?.data).toEqual([NOTIFICATION]);
  });

  it("markNotificationAsRead issues a PATCH to the notification's mark-as-read route", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      new Response("OK", { status: 200, headers: { "content-type": "text/plain" } }),
    );

    await store.dispatch(
      appNotificationsApi.endpoints.markNotificationAsRead.initiate({
        projectId: "test-project",
        notificationId: "n1",
      }),
    );

    const call = fetchHandle.calls()[0];
    expect(call.method).toBe("PATCH");
    expect(call.url).toContain("/test-project/app-notifications/n1/mark-as-read");
  });

  it("markNotificationAsRead's text-response handler returns void instead of throwing", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      new Response("OK", { status: 200, headers: { "content-type": "text/plain" } }),
    );

    const result = await store.dispatch(
      appNotificationsApi.endpoints.markNotificationAsRead.initiate({
        projectId: "test-project",
        notificationId: "n1",
      }),
    );

    expect(result.error).toBeUndefined();
    expect(result.data).toBeUndefined();
  });

  it("markNotificationAsRead optimistically marks the cached first page as read", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: [NOTIFICATION],
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalItems: 1, hasMore: false },
      }),
    );
    await store.dispatch(
      appNotificationsApi.endpoints.fetchAppNotifications.initiate({
        projectId: "test-project",
        page: 1,
        limit: 10,
      }),
    );

    fetchHandle.fetchMock.mockResolvedValueOnce(
      new Response("OK", { status: 200, headers: { "content-type": "text/plain" } }),
    );
    await store.dispatch(
      appNotificationsApi.endpoints.markNotificationAsRead.initiate({
        projectId: "test-project",
        notificationId: "n1",
      }),
    );

    const cached = appNotificationsApi.endpoints.fetchAppNotifications.select({
      projectId: "test-project",
      page: 1,
      limit: 10,
    })(store.getState());
    expect(cached.data?.data[0].isRead).toBe(true);
  });

  describe("optimistic read updates", () => {
    const PAGE = (page: number, ids: string[]) =>
      jsonResponse({
        data: ids.map((id) => ({ ...NOTIFICATION, id })),
        pagination: { page, pageSize: 25, totalPages: 2, totalItems: 50, hasMore: page < 2 },
      });

    // Two pages fetched with a non-default limit, so neither is the
    // `page: 1, limit: 10` entry the updates used to hard-code.
    async function seedPages() {
      fetchHandle.fetchMock.mockResolvedValueOnce(PAGE(1, ["n1"]));
      fetchHandle.fetchMock.mockResolvedValueOnce(PAGE(2, ["n2"]));
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse(2));
      for (const page of [1, 2]) {
        await store.dispatch(
          appNotificationsApi.endpoints.fetchAppNotifications.initiate({
            projectId: "test-project",
            page,
            limit: 25,
          }),
        );
      }
      await store.dispatch(
        appNotificationsApi.endpoints.countUnreadNotifications.initiate({ projectId: "test-project" }),
      );
    }

    const readFlags = () =>
      [1, 2].map(
        (page) =>
          appNotificationsApi.endpoints.fetchAppNotifications.select({
            projectId: "test-project",
            page,
            limit: 25,
          })(store.getState()).data?.data[0].isRead,
      );
    const cachedCount = () =>
      appNotificationsApi.endpoints.countUnreadNotifications.select({
        projectId: "test-project",
      })(store.getState()).data;

    // A mutation that hangs until released, so the optimistic state can be
    // read while the request is in flight.
    function holdNextResponse() {
      let release!: (response: Response) => void;
      const gate = new Promise<Response>((resolve) => (release = resolve));
      fetchHandle.fetchMock.mockImplementationOnce(() => gate);
      return release;
    }

    it("markNotificationAsRead patches the notification on any cached page and limit", async () => {
      await seedPages();
      const release = holdNextResponse();

      const pending = store.dispatch(
        appNotificationsApi.endpoints.markNotificationAsRead.initiate({
          projectId: "test-project",
          notificationId: "n2",
        }),
      );
      await Promise.resolve();
      expect(readFlags()).toEqual([false, true]);

      release(jsonResponse({}));
      await pending;
    });

    it("markNotificationAsRead reverts the patch when the request fails", async () => {
      await seedPages();

      await store.dispatch(
        appNotificationsApi.endpoints.markNotificationAsRead.initiate({
          projectId: "test-project",
          notificationId: "n2",
        }),
      );

      expect(readFlags()).toEqual([false, false]);
    });

    it("markAllNotificationsAsRead patches every cached page and the count", async () => {
      await seedPages();
      const release = holdNextResponse();

      const pending = store.dispatch(
        appNotificationsApi.endpoints.markAllNotificationsAsRead.initiate({
          projectId: "test-project",
        }),
      );
      await Promise.resolve();
      expect(readFlags()).toEqual([true, true]);
      expect(cachedCount()).toBe(0);

      release(jsonResponse({ markedAsRead: 2 }));
      await pending;
    });

    it("markAllNotificationsAsRead reverts the pages and the count when the request fails", async () => {
      await seedPages();

      await store.dispatch(
        appNotificationsApi.endpoints.markAllNotificationsAsRead.initiate({
          projectId: "test-project",
        }),
      );

      expect(readFlags()).toEqual([false, false]);
      expect(cachedCount()).toBe(2);
    });

    it("leaves another project's cached pages alone", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(PAGE(1, ["n1"]));
      await store.dispatch(
        appNotificationsApi.endpoints.fetchAppNotifications.initiate({
          projectId: "other-project",
          page: 1,
          limit: 25,
        }),
      );
      const release = holdNextResponse();

      const pending = store.dispatch(
        appNotificationsApi.endpoints.markAllNotificationsAsRead.initiate({
          projectId: "test-project",
        }),
      );
      await Promise.resolve();
      const other = appNotificationsApi.endpoints.fetchAppNotifications.select({
        projectId: "other-project",
        page: 1,
        limit: 25,
      })(store.getState());
      expect(other.data?.data[0].isRead).toBe(false);

      release(jsonResponse({ markedAsRead: 0 }));
      await pending;
    });
  });

  it("countUnreadNotifications issues a GET to the count route", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse(4));

    const result = await store.dispatch(
      appNotificationsApi.endpoints.countUnreadNotifications.initiate({
        projectId: "test-project",
      }),
    );

    expect(fetchHandle.calls()[0].url).toContain("/test-project/app-notifications/count");
    expect(result.data).toBe(4);
  });

  it("markAllNotificationsAsRead issues a PATCH and optimistically zeroes the cached unread count", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse(3));
    await store.dispatch(
      appNotificationsApi.endpoints.countUnreadNotifications.initiate({ projectId: "test-project" }),
    );

    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ markedAsRead: 3 }));
    await store.dispatch(
      appNotificationsApi.endpoints.markAllNotificationsAsRead.initiate({
        projectId: "test-project",
      }),
    );

    const patchCall = fetchHandle.calls().find((c) => c.method === "PATCH");
    expect(patchCall?.url).toContain("/test-project/app-notifications/mark-all-as-read");

    const cachedCount = appNotificationsApi.endpoints.countUnreadNotifications.select({
      projectId: "test-project",
    })(store.getState());
    expect(cachedCount.data).toBe(0);
  });

  it("surfaces a non-2xx response as a query error", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));

    const result = await store.dispatch(
      appNotificationsApi.endpoints.fetchAppNotifications.initiate({
        projectId: "test-project",
        page: 1,
        limit: 10,
      }),
    );

    expect(result.isError).toBe(true);
    expect((result.error as { status: number }).status).toBe(500);
  });
});
