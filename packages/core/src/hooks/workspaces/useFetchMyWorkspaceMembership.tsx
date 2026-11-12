import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { WorkspaceMemberStanding } from "../../interfaces/models/Workspace";

export interface FetchMyWorkspaceMembershipProps {
  workspaceId: string;
}

/**
 * Read the signed-in user's own standing on a workspace — the same record
 * `useFetchWorkspaceMemberStanding` returns for another user (`{ user,
 * reasons, capabilities, permissions, rank, relativeRank, title, metadata }`).
 *
 * Your own access is never hidden, so every field is present. `relativeRank`
 * is `0` when you have a member row here and `null` when you don't (an owner
 * or ancestor-owner without one). With no relation to the workspace at all
 * the answer is still a record, with `reasons: []`.
 */
function useFetchMyWorkspaceMembership(): (
  props: FetchMyWorkspaceMembershipProps
) => Promise<WorkspaceMemberStanding> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchMyWorkspaceMembership = useCallback(
    async ({ workspaceId }: FetchMyWorkspaceMembershipProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }
      if (!workspaceId) {
        throw new Error("Please pass a workspaceId");
      }

      const response = await axios.get<WorkspaceMemberStanding>(
        `/${projectId}/workspaces/${workspaceId}/members/me`
      );

      return response.data;
    },
    [projectId, axios]
  );

  return fetchMyWorkspaceMembership;
}

export default useFetchMyWorkspaceMembership;
