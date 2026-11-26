import { useState, useEffect, useCallback, useRef } from "react";
import useFollowUser from "./useFollowUser";
import useUnfollowUserByUserId from "./useUnfollowUserByUserId";
import useFetchFollowStatus from "./useFetchFollowStatus";
import useUser from "../../user/useUser";

export interface UseFollowToggleProps {
  userId: string;
}

export interface UseFollowManagerValues {
  isFollowing: boolean | null;
  loading: boolean;
  toggleFollow: () => Promise<void>;
}

function useFollowManager({ userId }: UseFollowToggleProps): UseFollowManagerValues {
  const { user } = useUser();

  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const followUser = useFollowUser();
  const unfollowUserByUserId = useUnfollowUserByUserId();
  const fetchFollowStatus = useFetchFollowStatus();

  // Keep a ref so the effect always calls the latest version without being in deps
  const fetchFollowStatusRef = useRef(fetchFollowStatus);
  fetchFollowStatusRef.current = fetchFollowStatus;

  useEffect(() => {
    const loadFollowStatus = async () => {
      try {
        setLoading(true);
        const result = await fetchFollowStatusRef.current({ userId });
        setIsFollowing(result.isFollowing);
      } catch (error) {
        console.error("Failed to fetch follow status:", error);
        setIsFollowing(false);
      } finally {
        setLoading(false);
      }
    };

    if (userId && user?.id && user.id !== userId) {
      loadFollowStatus();
    }
  }, [userId, user?.id]);

  const toggleFollow = useCallback(async () => {
    if (isFollowing === null || loading || user?.id === userId) return;

    try {
      if (isFollowing) {
        await unfollowUserByUserId({ userId });
        setIsFollowing(false);
      } else {
        await followUser({ userId });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Failed to toggle follow status:", error);
    }
  }, [isFollowing, loading, userId, followUser, unfollowUserByUserId]);

  return {
    isFollowing,
    loading,
    toggleFollow,
  };
}

export default useFollowManager;
