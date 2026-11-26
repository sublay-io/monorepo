import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface RevokeWorkspaceInviteProps {
  workspaceId: string;
  inviteId: string;
}

/**
 * Revoke a pending invitation. Requires the `invite` capability (or owner).
 * Note this is a POST to `.../invites/:inviteId/revoke`, not a DELETE.
 */
function useRevokeWorkspaceInvite(): (
  props: RevokeWorkspaceInviteProps
) => Promise<void> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const revokeWorkspaceInvite = useCallback(
    async ({ workspaceId, inviteId }: RevokeWorkspaceInviteProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }
      if (!workspaceId) {
        throw new SublayError("Please pass a workspaceId");
      }
      if (!inviteId) {
        throw new SublayError("Please pass an inviteId");
      }

      await axios.post<void>(
        `/${projectId}/workspaces/${workspaceId}/invites/${inviteId}/revoke`,
        {}
      );
    },
    [projectId, axios]
  );

  return revokeWorkspaceInvite;
}

export default useRevokeWorkspaceInvite;
