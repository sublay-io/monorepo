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
  isLoading: boolean;
  toggleBlock: () => Promise<void>;
}

function useBlockManager({ userId }: UseBlockManagerProps): UseBlockManagerValues {
  const { user } = useUser();

  const [isBlocking, setIsBlocking] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const fetchBlockStatus = useFetchBlockStatus();

  // Keep a ref so the effect always calls the latest version without being in deps
  const fetchBlockStatusRef = useRef(fetchBlockStatus);
  fetchBlockStatusRef.current = fetchBlockStatus;

  useEffect(() => {
    const loadBlockStatus = async () => {
      try {
        setIsLoading(true);
        const result = await fetchBlockStatusRef.current({ userId });
        setIsBlocking(result.isBlocking);
      } catch (error) {
        console.error("Failed to fetch block status:", error);
        setIsBlocking(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId && user?.id && user.id !== userId) {
      loadBlockStatus();
    }
  }, [userId, user?.id]);

  const toggleBlock = useCallback(async () => {
    if (isBlocking === null || isLoading || user?.id === userId) return;

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
  }, [isBlocking, isLoading, userId, blockUser, unblockUser]);

  return {
    isBlocking,
    isLoading,
    toggleBlock,
  };
}

export default useBlockManager;
