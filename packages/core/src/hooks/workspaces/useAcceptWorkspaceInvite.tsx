import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { WorkspaceMemberStanding } from "../../interfaces/models/Workspace";
import { SublayError } from "../../errors/SublayError";

export interface AcceptWorkspaceInviteProps {
  inviteId: string;
}

/**
 * Accept an invitation — identity-matched to the bearer-token user + verified
 * email required. Non-secret id.
 *
 * Resolves to the signed-in user's standing in the workspace — the same record
 * `useFetchMyWorkspaceMembership` returns. The server answers 201 when the
 * accept made the user a member, and 200 when they already were (or own the
 * workspace), including a repeat accept of an invite they already accepted.
 * An invite that is revoked, declined, expired, accepted by someone else, or
 * accepted by a user who has since left fails with 409 `workspace/not-pending`.
 */
function useAcceptWorkspaceInvite(): (
  props: AcceptWorkspaceInviteProps
) => Promise<WorkspaceMemberStanding> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const acceptWorkspaceInvite = useCallback(
    async ({ inviteId }: AcceptWorkspaceInviteProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }
      if (!inviteId) {
        throw new SublayError("Please pass an inviteId");
      }

      const response = await axios.post<WorkspaceMemberStanding>(
        `/${projectId}/workspace-invites/${inviteId}/accept`,
        {}
      );

      return response.data;
    },
    [projectId, axios]
  );

  return acceptWorkspaceInvite;
}

export default useAcceptWorkspaceInvite;
