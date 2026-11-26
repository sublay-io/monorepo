import { useEffect, useMemo } from "react";
import { useSublayDispatch, useSublaySelector } from "../../store/hooks";

import {
  setProjectContext,
  setLimit,
  selectAppNotifications,
  selectUnreadCount,
  selectAppNotificationsLoading,
  selectAppNotificationsHasMore,
  selectCurrentProjectId,
} from "../../store/slices/appNotificationsSlice";
import { useAppNotificationsActions } from "./useAppNotificationsActions";
import useProject from "../projects/useProject";
import { useUser } from "../user";
import { NotificationTemplates, UnifiedAppNotification } from "../../interfaces/models/AppNotification";
import addNotificationsMessages from "../../helpers/addNotificationsMessages";

export interface UseAppNotificationsProps {
  limit?: number;
  notificationTemplates?: Partial<NotificationTemplates>;
}

export interface UseAppNotificationsValues {
  appNotifications: UnifiedAppNotification[];
  unreadAppNotificationsCount: number;
  loading: boolean;
  /** The last load failure. Cleared when the next load starts; `loadMore()` retries it. */
  error: Error | null;
  /** Whether `loadMore()` has anything to fetch: a next page, or a load that failed. */
  hasMore: boolean;
  /**
   * Load the next page, or retry the load that failed (a failed first page
   * included). Does nothing while a page is loading or when there is nothing
   * more. Never rejects.
   */
  loadMore: () => Promise<void>;
  /**
   * Reload page 1. The notifications stay until the new page replaces them.
   * Never rejects.
   */
  refetch: () => Promise<void>;
  markNotificationAsRead: ({ notificationId }: { notificationId: string }) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

/**
 * Redux-powered hook that provides the exact same interface as useAppNotificationsData()
 * This is a drop-in replacement for the Context-based hook
 */
function useAppNotifications({
  limit = 10,
  notificationTemplates,
}: UseAppNotificationsProps = {}): UseAppNotificationsValues {
  const dispatch = useSublayDispatch();

  // Get external context
  const { projectId } = useProject();
  const { user } = useUser();

  // Get Redux state
  const appNotifications = useSublaySelector(selectAppNotifications);
  const unreadAppNotificationsCount = useSublaySelector(selectUnreadCount);
  const loading = useSublaySelector(selectAppNotificationsLoading);
  const hasMore = useSublaySelector(selectAppNotificationsHasMore);
  const currentProjectId = useSublaySelector(selectCurrentProjectId);

  // Get actions (templates are applied at display time, not fetch time)
  const {
    error,
    loadMore,
    refetch,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    updateUnreadCount,
  } = useAppNotificationsActions();

  // Update Redux state when props change
  useEffect(() => {
    if (projectId && projectId !== currentProjectId) {
      dispatch(setProjectContext(projectId));
    }
  }, [dispatch, projectId, currentProjectId]);

  useEffect(() => {
    dispatch(setLimit(limit));
  }, [dispatch, limit]);

  // Fetch unread count on mount and when dependencies change
  useEffect(() => {
    if (projectId && user) {
      updateUnreadCount();
    }
  }, [updateUnreadCount, projectId, user]);

  // Fetch the first page when dependencies change
  useEffect(() => {
    if (projectId && user) {
      refetch();
    }
  }, [refetch, projectId, user]);

  // Apply templates at display time (not at fetch time)
  // This ensures templates are always applied fresh from props
  const templatedNotifications = useMemo(
    () => addNotificationsMessages(appNotifications, notificationTemplates),
    [appNotifications, notificationTemplates]
  );

  // Return the same interface as the original hook
  return useMemo(
    () => ({
      appNotifications: templatedNotifications,
      unreadAppNotificationsCount,
      loading,
      error,
      // A failed load is still to do: `loadMore()` retries it.
      hasMore: hasMore || error !== null,
      loadMore,
      refetch,
      markNotificationAsRead,
      markAllNotificationsAsRead,
    }),
    [
      templatedNotifications,
      unreadAppNotificationsCount,
      loading,
      error,
      hasMore,
      loadMore,
      refetch,
      markNotificationAsRead,
      markAllNotificationsAsRead,
    ]
  );
}

export default useAppNotifications;
