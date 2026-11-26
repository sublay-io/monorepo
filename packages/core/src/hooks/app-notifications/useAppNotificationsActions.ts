import { useCallback } from "react";
import { useStore } from "react-redux";
import { useSublayDispatch, useSublaySelector } from "../../store/hooks";
import type { SublayState } from "../../store/sublayReducers";
import {
  runSharedListLoad,
  sharedLoadMore,
  useSharedListStatus,
} from "../list/sharedListStatus";
import {
  setPage,
  setLoading,
  addNotifications,
  markAsReadLocally,
  markAllAsReadLocally,
  revertMarkAsReadLocally,
  setUnreadCount,
  selectAppNotifications,
  selectUnreadCount,
  selectCurrentProjectId,
  selectAppNotificationsPage,
  selectAppNotificationsLimit,
  selectAppNotificationsHasMore,
} from "../../store/slices/appNotificationsSlice";
import {
  useLazyFetchAppNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useLazyCountUnreadNotificationsQuery,
} from "../../store/api/appNotificationsApi";
import { handleError } from "../../utils/handleError";
import useProject from "../projects/useProject";
import { useUser } from "../user";
import { SublayError, rethrowAsSublayError, toSublayError } from "../../errors/SublayError";

export interface UseAppNotificationsActionsValues {
  /** The last load failure, shared by every hook showing the notifications. Cleared when the next load starts. */
  error: SublayError | null;
  /**
   * Load the next page, or retry the load that failed (a failed first page
   * included). Does nothing while a page is loading or when there is nothing
   * more. Never rejects.
   */
  loadMore: () => Promise<void>;
  /** Reload page 1. Never rejects. */
  refetch: () => Promise<void>;
  markNotificationAsRead: ({ notificationId }: { notificationId: string }) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  updateUnreadCount: () => Promise<void>;
}

/**
 * Hook that provides Redux-powered actions for app notifications
 * Integrates RTK Query with Redux slice actions
 *
 * Note: Templates are applied at display time in useAppNotifications, not here.
 * This ensures templates are always fresh and avoids race conditions.
 */
export function useAppNotificationsActions(): UseAppNotificationsActionsValues {
  const dispatch = useSublayDispatch();

  // Get current state for actions
  const projectIdFromSlice = useSublaySelector(selectCurrentProjectId);
  const notifications = useSublaySelector(selectAppNotifications);
  const unreadCount = useSublaySelector(selectUnreadCount);

  // Get project and user context (fallback to current hooks)
  const { projectId: projectIdFromHook } = useProject();
  const { user } = useUser();

  // Use project ID from slice if available, otherwise from hook
  const projectId = projectIdFromSlice || projectIdFromHook;

  // RTK Query hooks
  const [triggerFetchNotifications] = useLazyFetchAppNotificationsQuery();
  const [markNotificationAsReadMutation] = useMarkNotificationAsReadMutation();
  const [markAllNotificationsAsReadMutation] = useMarkAllNotificationsAsReadMutation();
  const [triggerCountUnread] = useLazyCountUnreadNotificationsQuery();

  // Mark notification as read action
  const markNotificationAsRead = useCallback(
    async ({ notificationId }: { notificationId: string }) => {
      if (!projectId || !user) {
        throw new SublayError("No project ID or authenticated user available");
      }

      const wasUnread = notifications.some(
        (n) => n.id === notificationId && !n.isRead
      );

      try {
        // Optimistic update
        dispatch(markAsReadLocally(notificationId));

        // Make API call
        await markNotificationAsReadMutation({
          projectId,
          notificationId,
        }).unwrap().catch(rethrowAsSublayError);
      } catch (error) {
        if (wasUnread) {
          dispatch(revertMarkAsReadLocally({ notificationIds: [notificationId] }));
        }
        handleError(error, "Failed to mark notification as read:");
        throw toSublayError(error);
      }
    },
    [dispatch, projectId, user, notifications, markNotificationAsReadMutation]
  );

  // Load bookkeeping shared by every hook showing the notifications.
  const store = useStore<{ sublay: SublayState }>();
  const { status, error } = useSharedListStatus("appNotifications");

  // Load page 1 (`first`) or the page after the last one loaded.
  const loadPage = useCallback(
    (first: boolean) =>
      runSharedListLoad(
        status,
        { first, errorLabel: "Failed to fetch notifications:" },
        async (isCurrent) => {
          if (!projectId || !user) return;
          const state = store.getState();
          const page = first ? 1 : selectAppNotificationsPage(state) + 1;
          dispatch(setLoading(true));
          try {
            const response = await triggerFetchNotifications({
              projectId,
              page,
              limit: selectAppNotificationsLimit(state),
            }).unwrap().catch(rethrowAsSublayError);
            if (!isCurrent() || !response) return;
            const { data: notifications, pagination } = response;
            // Store raw notifications - templates applied at display time
            dispatch(
              addNotifications({
                notifications,
                hasMore: pagination.hasMore,
                isFirstPage: first,
              })
            );
            dispatch(setPage(page));
          } finally {
            if (isCurrent()) dispatch(setLoading(false));
          }
        }
      ),
    [status, store, dispatch, projectId, user, triggerFetchNotifications]
  );

  const loadMore = useCallback(async () => {
    if (!projectId || !user) return;
    await sharedLoadMore(status, {
      hasMore: () => selectAppNotificationsHasMore(store.getState()),
      retryFirst: () => loadPage(true),
      next: () => loadPage(false),
    });
  }, [projectId, user, status, store, loadPage]);

  // Reload page 1. The notifications stay until the new page replaces them.
  const refetch = useCallback(async () => {
    if (!projectId || !user) return;
    await loadPage(true);
  }, [projectId, user, loadPage]);

  // Update unread count
  const updateUnreadCount = useCallback(async () => {
    if (!projectId || !user) return;

    try {
      const count = await triggerCountUnread({ projectId }).unwrap().catch(rethrowAsSublayError);
      if (typeof count === "number") {
        dispatch(setUnreadCount(count));
      }
    } catch (error) {
      handleError(error, "Failed to fetch unread count:");
    }
  }, [dispatch, projectId, user, triggerCountUnread]);

  // Mark all notifications as read action
  const markAllNotificationsAsRead = useCallback(async () => {
    if (!projectId || !user) {
      throw new SublayError("No project ID or authenticated user available");
    }

    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);

    try {
      // Optimistic update
      dispatch(markAllAsReadLocally());

      // Make API call
      await markAllNotificationsAsReadMutation({ projectId }).unwrap().catch(rethrowAsSublayError);
    } catch (error) {
      dispatch(revertMarkAsReadLocally({ notificationIds: unreadIds, unreadCount }));
      handleError(error, "Failed to mark all notifications as read:");
      throw toSublayError(error);
    }
  }, [dispatch, projectId, user, notifications, unreadCount, markAllNotificationsAsReadMutation]);

  return {
    error,
    loadMore,
    refetch,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    updateUnreadCount, // Internal action
  };
}

export default useAppNotificationsActions;
