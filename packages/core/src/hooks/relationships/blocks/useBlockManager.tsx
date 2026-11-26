import { useState, useEffect, useCallback, useRef } from "react";
import useBlockUser from "./useBlockUser";
import useUnblockUser from "./useUnblockUser";
import useFetchBlockStatus from "./useFetchBlockStatus";
import useUser from "../../user/useUser";

export interface UseBlockManagerProps {
  userId: string;
}

export interface UseBlockManagerValues {
  /** Whether the signed-in user blocks `userId` (null until loaded). */
  isBlocking: boolean | null;
  loading: boolean;
  toggleBlock: () => Promise<void>;
}

function useBlockManager({ userId }: UseBlockManagerProps): UseBlockManagerValues {
  const { user } = useUser();

  const [isBlocking, setIsBlocking] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const fetchBlockStatus = useFetchBlockStatus();

  // Keep a ref so the effect always calls the latest version without being in deps
  const fetchBlockStatusRef = useRef(fetchBlockStatus);
  fetchBlockStatusRef.current = fetchBlockStatus;

  useEffect(() => {
    const loadBlockStatus = async () => {
      try {
        setLoading(true);
        const result = await fetchBlockStatusRef.current({ userId });
        setIsBlocking(result.isBlocking);
      } catch (error) {
        console.error("Failed to fetch block status:", error);
        setIsBlocking(false);
      } finally {
        setLoading(false);
      }
    };

    if (userId && user?.id && user.id !== userId) {
      loadBlockStatus();
    }
  }, [userId, user?.id]);

  const toggleBlock = useCallback(async () => {
    if (isBlocking === null || loading || user?.id === userId) return;

    try {
      if (isBlocking) {
        await unblockUser({ userId });
        setIsBlocking(false);
      } else {
        await blockUser({ userId });
        setIsBlocking(true);
      }
    } catch (error) {
      console.error("Failed to toggle block status:", error);
    }
  }, [isBlocking, loading, userId, blockUser, unblockUser]);

  return {
    isBlocking,
    loading,
    toggleBlock,
  };
}

export default useBlockManager;
