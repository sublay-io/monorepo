import { useCallback } from "react";
import { useSublayDispatch } from "../../store/hooks";
import { confirmAccountDeletionThunk } from "../../store/slices/authThunks";
import useProject from "../projects/useProject";
import { SublayError } from "../../errors/SublayError";
import { toAuthError } from "./useAuth";

export interface ConfirmAccountDeletionProps {
  /** The one-time code emailed by `useRequestAccountDeletion`. */
  code: string;
}

/**
 * Step 2 of self-service account deletion. Verifies the emailed code and then
 * permanently deletes the signed-in user's account (same cascade as the
 * admin/service delete). On success the local session is torn down like a
 * sign-out — the deleted account is removed from the multi-account map and
 * **no other account is activated**, even if the user has others signed in.
 * The app lands signed-out; read `activeAccount` from `useAccounts` and render
 * your own next screen. This is immediate and cannot be undone.
 */
function useConfirmAccountDeletion(): (
  props: ConfirmAccountDeletionProps
) => Promise<void> {
  const { projectId } = useProject();
  const dispatch = useSublayDispatch();

  const confirmAccountDeletion = useCallback(
    async ({ code }: ConfirmAccountDeletionProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!code?.trim()) {
        throw new SublayError("Confirmation code is required.");
      }

      const result = await dispatch(
        confirmAccountDeletionThunk({ projectId, code: code.trim() })
      );

      if (confirmAccountDeletionThunk.rejected.match(result)) {
        throw toAuthError(result.payload);
      }
    },
    [projectId, dispatch]
  );

  return confirmAccountDeletion;
}

export default useConfirmAccountDeletion;
