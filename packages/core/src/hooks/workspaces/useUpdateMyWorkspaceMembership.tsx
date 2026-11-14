import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { WorkspaceMember } from "../../interfaces/models/Workspace";

export interface UpdateMyWorkspaceMembershipProps {
  workspaceId: string;
  // The new title (trimmed, up to 100 characters); `null` clears it. Required
  // for a member; the owner sends `title`, `metadata` or both.
  title?: string | null;
  // The workspace's owner only: replaces their metadata. A member who sends it
  // gets 400 `workspace/unsupported-param`.
  metadata?: Record<string, any>;
}

/**
 * Edit the signed-in user's own profile on a workspace. Needs no capability.
 * A member edits their `title` only: their other fields are edited by a member
 * with the capability, through `useUpdateWorkspaceMember`. The workspace's
 * owner edits their `title` and `metadata` here, and only here. A user with no
 * member row who is not the owner gets 404 `workspace/not-found`. Resolves to
 * the updated member record, as `useUpdateWorkspaceMember` does; for the owner
 * it holds the profile only (`rank: null`, no capabilities or permissions).
 */
function useUpdateMyWorkspaceMembership(): (
  props: UpdateMyWorkspaceMembershipProps
) => Promise<WorkspaceMember> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const updateMyWorkspaceMembership = useCallback(
    async ({ workspaceId, title, metadata }: UpdateMyWorkspaceMembershipProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }
      if (!workspaceId) {
        throw new Error("Please pass a workspaceId");
      }

      const response = await axios.patch<WorkspaceMember>(
        `/${projectId}/workspaces/${workspaceId}/members/me`,
        { title, metadata }
      );

      return response.data;
    },
    [projectId, axios]
  );

  return updateMyWorkspaceMembership;
}

export default useUpdateMyWorkspaceMembership;
