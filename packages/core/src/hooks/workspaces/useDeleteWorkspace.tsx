import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface DeleteWorkspaceProps {
  workspaceId: string;
}

/**
 * Delete a workspace. Owner-only — the actor (the bearer-token user) must be
 * the workspace's own owner or an ancestor owner.
 */
function useDeleteWorkspace(): (
  props: DeleteWorkspaceProps
) => Promise<void> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const deleteWorkspace = useCallback(
    async ({ workspaceId }: DeleteWorkspaceProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }
      if (!workspaceId) {
        throw new SublayError("Please pass a workspaceId");
      }

      await axios.delete<void>(
        `/${projectId}/workspaces/${workspaceId}`
      );
    },
    [projectId, axios]
  );

  return deleteWorkspace;
}

export default useDeleteWorkspace;
