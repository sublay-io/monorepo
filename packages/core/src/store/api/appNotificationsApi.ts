import { baseApi } from "./baseApi";
import type { UnifiedAppNotification } from "../../interfaces/models/AppNotification";
import type { PaginatedResponse } from "../../interfaces/PaginatedResponse";

// API parameters types
interface FetchAppNotificationsParams {
  projectId: string;
  page: number;
  limit: number;
}

interface MarkNotificationAsReadParams {
  projectId: string;
  notificationId: string;
}

interface CountUnreadNotificationsParams {
  projectId: string;
}

interface MarkAllNotificationsAsReadParams {
  projectId: string;
}

interface MarkAllNotificationsAsReadResponse {
  markedAsRead: number;
}

// Extended API with app notifications endpoints
export const appNotificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch paginated app notifications
    fetchAppNotifications: builder.query<
      PaginatedResponse<UnifiedAppNotification>,
      FetchAppNotificationsParams
    >({
      query: ({ projectId, page, limit }) => ({
        url: `/${projectId}/app-notifications`,
        method: "GET",
        params: {
          page,
          limit,
        },
      }),
      providesTags: (result, error, { projectId }) => [
        { type: "AppNotification" as const, id: `${projectId}-LIST` },
        ...(result?.data?.map(({ id }) => ({
          type: "AppNotification" as const,
          id,
        })) ?? []),
      ],
    }),

    // Mark a notification as read
    markNotificationAsRead: builder.mutation<
      void,
      MarkNotificationAsReadParams
    >({
      query: ({ projectId, notificationId }) => ({
        url: `/${projectId}/app-notifications/${notificationId}/mark-as-read`,
        method: "PATCH",
        body: {},
        responseHandler: async (response) => {
          // Handle text responses (like "OK" from res.sendStatus(200))
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            return response.json();
          }
          // For text responses, just return void since we don't need the content
          return response.text().then(() => undefined);
        },
      }),
      // Optimistically update the cache
      async onQueryStarted(
        { projectId, notificationId },
        { dispatch, getState, queryFulfilled }
      ) {
        const patches = cachedListArgs(getState(), projectId).map((args) =>
          dispatch(
            appNotificationsApi.util.updateQueryData(
              "fetchAppNotifications",
              args,
              (draft) => {
                const notification = draft.data.find(
                  (n) => n.id === notificationId
                );
                if (notification) {
                  notification.isRead = true;
                }
              }
            )
          )
        );

        try {
          await queryFulfilled;
        } catch {
          // Revert optimistic update on failure
          patches.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: (result, error, { projectId, notificationId }) => [
        { type: "AppNotification", id: notificationId },
        { type: "AppNotification", id: `${projectId}-LIST` },
      ],
    }),

    // Count unread notifications
    countUnreadNotifications: builder.query<
      number,
      CountUnreadNotificationsParams
    >({
      query: ({ projectId }) => ({
        url: `/${projectId}/app-notifications/count`,
        method: "GET",
      }),
      providesTags: (result, error, { projectId }) => [
        { type: "AppNotification", id: `${projectId}-COUNT` },
      ],
    }),

    // Mark all notifications as read
    markAllNotificationsAsRead: builder.mutation<
      MarkAllNotificationsAsReadResponse,
      MarkAllNotificationsAsReadParams
    >({
      query: ({ projectId }) => ({
        url: `/${projectId}/app-notifications/mark-all-as-read`,
        method: "PATCH",
        body: {},
      }),
      // Optimistically update the cache
      async onQueryStarted(
        { projectId },
        { dispatch, getState, queryFulfilled }
      ) {
        const patches = cachedListArgs(getState(), projectId).map((args) =>
          dispatch(
            appNotificationsApi.util.updateQueryData(
              "fetchAppNotifications",
              args,
              (draft) => {
                draft.data.forEach((notification) => {
                  notification.isRead = true;
                });
              }
            )
          )
        );

        // Update unread count to 0
        patches.push(
          dispatch(
            appNotificationsApi.util.updateQueryData(
              "countUnreadNotifications",
              { projectId },
              () => 0
            )
          )
        );

        try {
          await queryFulfilled;
        } catch {
          // Revert optimistic update on failure
          patches.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: (result, error, { projectId }) => [
        { type: "AppNotification", id: `${projectId}-LIST` },
        { type: "AppNotification", id: `${projectId}-COUNT` },
      ],
    }),
  }),
});

// Every cached notifications page of this project, whatever its page and
// limit, so an optimistic update reaches each list a component has fetched.
function cachedListArgs(
  state: Parameters<typeof appNotificationsApi.util.selectCachedArgsForQuery>[0],
  projectId: string
): FetchAppNotificationsParams[] {
  return appNotificationsApi.util
    .selectCachedArgsForQuery(state, "fetchAppNotifications")
    .filter((args) => args.projectId === projectId);
}

// Export hooks for use in components
export const {
  useFetchAppNotificationsQuery,
  useLazyFetchAppNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useCountUnreadNotificationsQuery,
  useLazyCountUnreadNotificationsQuery,
} = appNotificationsApi;

// Export for manual cache management
export const {
  fetchAppNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  countUnreadNotifications,
} = appNotificationsApi.endpoints;
