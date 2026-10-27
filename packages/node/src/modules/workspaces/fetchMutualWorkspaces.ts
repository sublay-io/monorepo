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
  /** The OTHER user — workspaces both this user and the acting user can open are returned. */
  userId: string;
  /** The acting (authenticated) user. Required: a service key names the user it acts as. */
  actingUserId: string;
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
 * List the workspaces the acting user and another user have in common. Each
 * row's `reasons` is the acting user's standing on it.
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
