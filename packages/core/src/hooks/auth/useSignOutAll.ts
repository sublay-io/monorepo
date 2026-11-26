import { useCallback } from "react";
import { useSublayDispatch } from "../../store/hooks";
import { signOutAllThunk } from "../../store/slices/authThunks";
import useProject from "../projects/useProject";
import { SublayError } from "../../errors/SublayError";

export interface UseSignOutAllReturn {
  signOutAll: () => Promise<void>;
}

export default function useSignOutAll(): UseSignOutAllReturn {
  const dispatch = useSublayDispatch();
  const { projectId } = useProject();

  const signOutAll = useCallback(async () => {
    if (!projectId) {
      throw new SublayError("No projectId available.");
    }

    const result = await dispatch(signOutAllThunk({ projectId }));

    if (signOutAllThunk.rejected.match(result)) {
      throw new SublayError(result.payload as string);
    }
  }, [dispatch, projectId]);

  return { signOutAll };
}
