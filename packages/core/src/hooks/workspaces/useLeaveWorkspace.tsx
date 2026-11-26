import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface LeaveWorkspaceProps {
  workspaceId: string;
}

/**
 * Self-service departure — removes the bearer-token user's DIRECT membership on
 * this node only (descendant memberships are untouched). An owner cannot leave
 * their own workspace (409 `workspace/sole-owner`); transfer ownership or
 * delete it first. A user who only reaches in, with no direct membership here,
 * gets 403 `workspace/not-member`; one who can't see the workspace at all gets
 * 404 `workspace/not-found`, as for a missing one.
 */
function useLeaveWorkspace(): (props: LeaveWorkspaceProps) => Promise<void> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const leaveWorkspace = useCallback(
    async ({ workspaceId }: LeaveWorkspaceProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }
      if (!workspaceId) {
        throw new SublayError("Please pass a workspaceId");
      }

      await axios.delete<void>(
        `/${projectId}/workspaces/${workspaceId}/members/me`
      );
    },
    [projectId, axios]
  );

  return leaveWorkspace;
}

export default useLeaveWorkspace;
