import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { SublayError } from "../../errors/SublayError";

/**
 * Step 1 of self-service account deletion. Emails the signed-in user a one-time
 * confirmation code. Pass that code to `useConfirmAccountDeletion` to
 * permanently delete the account.
 *
 * Requires the account to have an email on file — accounts without one (e.g.
 * anonymous or foreign-id users) must be deleted server-side with a service key
 * via the node SDK.
 */
function useRequestAccountDeletion(): () => Promise<void> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const requestAccountDeletion = useCallback(async () => {
    if (!projectId) {
      throw new SublayError("No projectId available.");
    }

    await axios.post(
      `/${projectId}/auth/request-account-deletion`,
      {}
    );
  }, [projectId, axios]);

  return requestAccountDeletion;
}

export default useRequestAccountDeletion;
