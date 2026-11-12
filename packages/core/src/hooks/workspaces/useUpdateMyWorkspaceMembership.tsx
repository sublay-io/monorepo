import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { WorkspaceMember } from "../../interfaces/models/Workspace";

export interface UpdateMyWorkspaceMembershipProps {
  workspaceId: string;
  // The new title (trimmed, up to 100 characters); `null` clears it.
  title: string | null;
}

/**
 * Edit the signed-in user's own `title` on a workspace. Needs no capability.
 * Only `title` is editable here: a member's other fields are edited by a
 * member with the capability, through `useUpdateWorkspaceMember`. You must
 * hold a member row on the workspace (the owner has none: 404
 * `workspace/not-found`). Resolves to the updated member record, as
 * `useUpdateWorkspaceMember` does.
 */
function useUpdateMyWorkspaceMembership(): (
  props: UpdateMyWorkspaceMembershipProps
) => Promise<WorkspaceMember> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const updateMyWorkspaceMembership = useCallback(
    async ({ workspaceId, title }: UpdateMyWorkspaceMembershipProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }
      if (!workspaceId) {
        throw new Error("Please pass a workspaceId");
      }

      const response = await axios.patch<WorkspaceMember>(
        `/${projectId}/workspaces/${workspaceId}/members/me`,
        { title }
      );

      return response.data;
    },
    [projectId, axios]
  );

  return updateMyWorkspaceMembership;
}

export default useUpdateMyWorkspaceMembership;
