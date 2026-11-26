import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface DeclineWorkspaceInviteProps {
  inviteId: string;
}

/**
 * Decline an invitation — identity-matched to the bearer-token user, and
 * verified-email-gated (the same gate as accept, so an unverified squatter on
 * someone else's address cannot burn their invite). An unverified decline
 * returns `403 workspace/email-not-verified`.
 */
function useDeclineWorkspaceInvite(): (
  props: DeclineWorkspaceInviteProps
) => Promise<void> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const declineWorkspaceInvite = useCallback(
    async ({ inviteId }: DeclineWorkspaceInviteProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }
      if (!inviteId) {
        throw new SublayError("Please pass an inviteId");
      }

      await axios.post<void>(
        `/${projectId}/workspace-invites/${inviteId}/decline`,
        {}
      );
    },
    [projectId, axios]
  );

  return declineWorkspaceInvite;
}

export default useDeclineWorkspaceInvite;
