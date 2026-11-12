import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import {
  WorkspaceMemberIncludeParam,
  WorkspaceRosterEntry,
  WorkspaceRosterCountsResponse,
} from "../../interfaces/models/Workspace";

export interface FetchWorkspaceMembersProps {
  workspaceId: string;
  // Add-on buckets: `ancestorOwners`, `reachHolders`, `descendants`.
  // Default returns owner + direct members only.
  include?: WorkspaceMemberIncludeParam;
  // Numbers-only escape hatch — per-reason counts + distinct-user total.
  countOnly?: boolean;
}

/**
 * The callable `useFetchWorkspaceMembers` returns. Typed by `countOnly`: a
 * call without it (or with `false`) resolves to the roster array, a call with
 * `countOnly: true` to the counts. A `boolean` only known at runtime gets the
 * union.
 */
export interface FetchWorkspaceMembers {
  (
    props: FetchWorkspaceMembersProps & { countOnly: true }
  ): Promise<WorkspaceRosterCountsResponse>;
  (
    props: FetchWorkspaceMembersProps & { countOnly?: false }
  ): Promise<WorkspaceRosterEntry[]>;
  (
    props: FetchWorkspaceMembersProps
  ): Promise<WorkspaceRosterEntry[] | WorkspaceRosterCountsResponse>;
}

/**
 * Unified roster read — one entry per distinct user, each with a `reasons`
 * array. Always returned in full (never paginated), as an array. With
 * `countOnly` it returns the counts instead (`WorkspaceRosterCountsResponse`).
 *
 * Same-node `member` reasons carry both rank coordinates: absolute `rank` and
 * `relativeRank`, the offset from you (`1` = one rung below you, `-3` = three
 * above). Both are fenced together and both are absent for a caller who does
 * not operate people here. `descendant-member` reasons carry `rank` only.
 */
function useFetchWorkspaceMembers(): FetchWorkspaceMembers {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchWorkspaceMembers = useCallback(
    async ({
      workspaceId,
      include,
      countOnly,
    }: FetchWorkspaceMembersProps): Promise<
      WorkspaceRosterEntry[] | WorkspaceRosterCountsResponse
    > => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }
      if (!workspaceId) {
        throw new Error("Please pass a workspaceId");
      }

      const params: Record<string, any> = {};
      if (include && include.length > 0) {
        params.include = Array.isArray(include) ? include.join(",") : include;
      }
      if (countOnly !== undefined) params.countOnly = countOnly;

      const response = await axios.get<
        | { data: WorkspaceRosterEntry[]; total: number }
        | WorkspaceRosterCountsResponse
      >(`/${projectId}/workspaces/${workspaceId}/members`, { params });

      if (countOnly) {
        return response.data as WorkspaceRosterCountsResponse;
      }
      return (response.data as { data: WorkspaceRosterEntry[] }).data;
    },
    [projectId, axios]
  );

  return fetchWorkspaceMembers as FetchWorkspaceMembers;
}

export default useFetchWorkspaceMembers;
