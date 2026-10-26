import { useCallback } from "react";
import { useSublayDispatch, useSublaySelector } from "../../store/hooks";
import {
  loadMore as loadMoreAction,
  resetNotifications,
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

export interface UseAppNotificationsActionsValues {
  loadMore: () => void;
  markNotificationAsRead: ({ notificationId }: { notificationId: string }) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  resetAppNotifications: () => Promise<void>;
  fetchMoreNotifications: ({ pageToFetch }: { pageToFetch: number }) => Promise<void>;
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
  const page = useSublaySelector(selectAppNotificationsPage);
  const limit = useSublaySelector(selectAppNotificationsLimit);
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

  // Load more action
  const loadMore = useCallback(() => {
    dispatch(loadMoreAction());
  }, [dispatch]);

  // Mark notification as read action
  const markNotificationAsRead = useCallback(
    async ({ notificationId }: { notificationId: string }) => {
      if (!projectId || !user) {
        throw new Error("No project ID or authenticated user available");
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
        }).unwrap();
      } catch (error) {
        if (wasUnread) {
          dispatch(revertMarkAsReadLocally({ notificationIds: [notificationId] }));
        }
        handleError(error, "Failed to mark notification as read:");
        throw error;
      }
    },
    [dispatch, projectId, user, notifications, markNotificationAsReadMutation]
  );

  // Reset notifications action
  const resetAppNotifications = useCallback(async () => {
    if (!projectId || !user) {
      throw new Error("No project ID or authenticated user available");
    }

    try {
      dispatch(setLoading(true));
      dispatch(resetNotifications());

      // Fetch first page
      const response = await triggerFetchNotifications({
        projectId,
        page: 1,
        limit,
      }).unwrap();

      if (response) {
        const { data: notifications, pagination } = response;
        // Store raw notifications - templates applied at display time
        dispatch(
          addNotifications({
            notifications,
            hasMore: pagination.hasMore,
            isFirstPage: true,
          })
        );
      }
    } catch (error) {
      handleError(error, "Failed to refresh notifications:");
      throw error;
    }
  }, [
    dispatch,
    projectId,
    user,
    triggerFetchNotifications,
    limit,
  ]);

  // Fetch more notifications (internal action triggered by page changes)
  const fetchMoreNotifications = useCallback(
    async ({ pageToFetch }: { pageToFetch: number }) => {
      if (!projectId || !user) return;

      try {
        dispatch(setLoading(true));

        const response = await triggerFetchNotifications({
          projectId,
          page: pageToFetch,
          limit,
        }).unwrap();

        if (response) {
          const { data: notifications, pagination } = response;
          // Store raw notifications - templates applied at display time
          dispatch(
            addNotifications({
              notifications,
              hasMore: pagination.hasMore,
            })
          );
        }
      } catch (error) {
        handleError(error, "Loading more app notifications failed:");
      } finally {
        dispatch(setLoading(false));
      }
    },
    [
      dispatch,
      projectId,
      user,
      triggerFetchNotifications,
      limit,
    ]
  );

  // Update unread count
  const updateUnreadCount = useCallback(async () => {
    if (!projectId || !user) return;

    try {
      const count = await triggerCountUnread({ projectId }).unwrap();
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
      throw new Error("No project ID or authenticated user available");
    }

    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);

    try {
      // Optimistic update
      dispatch(markAllAsReadLocally());

      // Make API call
      await markAllNotificationsAsReadMutation({ projectId }).unwrap();
    } catch (error) {
      dispatch(revertMarkAsReadLocally({ notificationIds: unreadIds, unreadCount }));
      handleError(error, "Failed to mark all notifications as read:");
      throw error;
    }
  }, [dispatch, projectId, user, notifications, unreadCount, markAllNotificationsAsReadMutation]);

  return {
    loadMore,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    resetAppNotifications,
    fetchMoreNotifications, // Internal action
    updateUnreadCount, // Internal action
  };
}

export default useAppNotificationsActions;
