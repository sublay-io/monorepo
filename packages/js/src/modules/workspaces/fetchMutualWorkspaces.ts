import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import {
  Workspace,
  WorkspaceIncludeParam,
  WorkspaceListRelation,
  WorkspaceListSortDir,
} from "../../interfaces/Workspace";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface FetchMutualWorkspacesProps {
  /** The OTHER user — workspaces both this user and the bearer-token user can open are returned. */
  userId: string;
  page?: number;
  limit?: number;
  // `memberCount` adds each row's DIRECT member count.
  include?: WorkspaceIncludeParam;
  // "reachable" (the default): workspaces each user can open by any reason.
  // "direct": workspaces each user owns or has a member row on.
  relation?: WorkspaceListRelation;
  // Order by creation time: "desc" (the default) newest first, "asc" oldest
  // first.
  sortDir?: WorkspaceListSortDir;
}

/**
 * List the workspaces the bearer-token user and another user have in common.
 * Each row's `reasons` is the bearer-token user's standing on it. The actor is
 * derived from the token — no actor field is sent.
 */
export async function fetchMutualWorkspaces(
  client: SublayHttpClient,
  { userId, ...params }: FetchMutualWorkspacesProps
): Promise<PaginatedResponse<Workspace>> {
  const response = await client.projectInstance.get<
    PaginatedResponse<Workspace>
  >(`/workspaces/mutual/${userId}`, {
    params: { ...params, include: serializeInclude(params.include) },
  });
  return response.data;
}
