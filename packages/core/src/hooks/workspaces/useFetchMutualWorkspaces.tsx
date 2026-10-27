import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import {
  Workspace,
  WorkspaceIncludeParam,
  WorkspaceListRelation,
  WorkspaceListSortDir,
} from "../../interfaces/models/Workspace";
import { PaginatedResponse } from "../../interfaces/PaginatedResponse";

export interface FetchMutualWorkspacesProps {
  /** The OTHER user — workspaces both this user and the caller can open are returned. */
  userId: string;
  page?: number;
  limit?: number;
  /** `memberCount` adds each row's DIRECT member count. */
  include?: WorkspaceIncludeParam;
  /**
   * `"reachable"` (the server's default): workspaces each user can open by any
   * reason. `"direct"`: workspaces each user owns or has a member row on.
   * Left out or `null`: `"reachable"` (`null` is never sent).
   */
  relation?: WorkspaceListRelation | null;
  /**
   * Order by creation time: `"desc"` (the server's default) newest first,
   * `"asc"` oldest first. Left out or `null`: `"desc"` (`null` is never sent).
   */
  sortDir?: WorkspaceListSortDir | null;
}

/**
 * Fetches one page of the workspaces the caller and another user have in
 * common. Each row's `reasons` is the CALLER's standing on it. The actor is
 * derived from the bearer token — no actor field is sent.
 *
 * Params are built conditionally: the workspaces endpoints refuse an undeclared
 * or `null` query value with a 400, so an unset slot is left out.
 */
function useFetchMutualWorkspaces(): (
  params: FetchMutualWorkspacesProps
) => Promise<PaginatedResponse<Workspace>> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchMutualWorkspaces = useCallback(
    async (params: FetchMutualWorkspacesProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }
      if (!params?.userId) {
        throw new Error("Please pass a userId");
      }

      const { userId, page, limit, include, relation, sortDir } = params;

      const queryParams: Record<string, any> = {};
      if (page !== undefined) queryParams.page = page;
      if (limit !== undefined) queryParams.limit = limit;
      if (include)
        queryParams.include = Array.isArray(include)
          ? include.join(",")
          : include;
      if (relation != null) queryParams.relation = relation;
      if (sortDir != null) queryParams.sortDir = sortDir;

      const response = await axios.get<PaginatedResponse<Workspace>>(
        `/${projectId}/workspaces/mutual/${userId}`,
        { params: queryParams }
      );

      return response.data;
    },
    [projectId, axios]
  );

  return fetchMutualWorkspaces;
}

export default useFetchMutualWorkspaces;
