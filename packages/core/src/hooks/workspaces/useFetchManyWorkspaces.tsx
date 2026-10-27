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

export interface FetchManyWorkspacesParams {
  page?: number;
  limit?: number;
  /**
   * Include flags, as an array or a comma-separated string. `memberCount` adds
   * each row's DIRECT member count — one grouped query over the page that was
   * returned, so a switcher UI does not need a follow-up read per workspace.
   * Omitted, the field is absent from every row.
   */
  include?: WorkspaceIncludeParam;
  /**
   * Narrows the list by where each workspace sits in the tree: `"none"`
   * returns the caller's top-level workspaces only; a workspace id returns
   * their workspaces directly under that workspace; `"any"` returns every
   * level. Left out or `null`: every level (`null` is never sent). The filter
   * applies within `relation`.
   */
  parentWorkspaceId?: string | "none" | "any" | null;
  /**
   * Which workspaces the list holds. `"reachable"` (the server's default):
   * every workspace the caller can open, through ownership, membership, owning
   * an ancestor, or a capability that reaches down from an ancestor.
   * `"direct"`: only the workspaces the caller owns or has a member row on.
   * Left out or `null`: `"reachable"` (`null` is never sent).
   */
  relation?: WorkspaceListRelation | null;
  /**
   * Order by creation time: `"desc"` (the server's default) newest first,
   * `"asc"` oldest first, which puts every parent before its children.
   * Left out or `null`: `"desc"` (`null` is never sent).
   */
  sortDir?: WorkspaceListSortDir | null;
}

/**
 * Leaf fetcher for one page of the caller's workspaces: every workspace they
 * can open, or with `relation: "direct"` only the ones they own or are a member
 * of. Each row carries `reasons`. The actor is derived from the bearer token —
 * no actor field is sent.
 *
 * Params are built conditionally rather than passed through: the workspaces
 * endpoints refuse any undeclared top-level query key with a 400, so an
 * `undefined` slot must not be spread into the request.
 */
function useFetchManyWorkspaces(): (
  params?: FetchManyWorkspacesParams
) => Promise<PaginatedResponse<Workspace>> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchManyWorkspaces = useCallback(
    async (params?: FetchManyWorkspacesParams) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      const queryParams: Record<string, any> = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.include)
        queryParams.include = Array.isArray(params.include)
          ? params.include.join(",")
          : params.include;
      // `null` means not set: left out.
      if (params?.parentWorkspaceId != null)
        queryParams.parentWorkspaceId = params.parentWorkspaceId;
      if (params?.relation != null) queryParams.relation = params.relation;
      if (params?.sortDir != null) queryParams.sortDir = params.sortDir;

      const response = await axios.get<PaginatedResponse<Workspace>>(
        `/${projectId}/workspaces`,
        { params: queryParams }
      );

      return response.data;
    },
    [projectId, axios]
  );

  return fetchManyWorkspaces;
}

export default useFetchManyWorkspaces;
