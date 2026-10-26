import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { Workspace, WorkspaceIncludeParam } from "../../interfaces/Workspace";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface FetchManyWorkspacesProps {
  page?: number;
  limit?: number;
  // Include flags. `memberCount` adds each row's DIRECT member
  // count — resolved in one grouped query over the page that was returned, so a
  // switcher UI does not need a follow-up read per workspace. Omit it and the
  // field is absent from every row. An unknown flag is a 400.
  include?: WorkspaceIncludeParam;
  // Narrows the list by where each workspace sits in the tree: "none" returns
  // top-level workspaces only; a workspace id returns the user's workspaces
  // directly under that workspace; "any" returns every level. Left out: every
  // level.
  parentWorkspaceId?: string | "none" | "any";
}

/**
 * List the bearer-token user's direct-membership + owned workspaces. The actor
 * is derived from the token — no actor field is sent.
 *
 * ⚠️ Only the fields declared above are accepted. The workspaces endpoints
 * refuse any undeclared top-level field with a 400 rather than ignoring it, so
 * do not spread an unrelated object into `data`.
 */
export async function fetchManyWorkspaces(
  client: SublayHttpClient,
  data: FetchManyWorkspacesProps = {}
): Promise<PaginatedResponse<Workspace>> {
  const response = await client.projectInstance.get<
    PaginatedResponse<Workspace>
  >("/workspaces", {
    params: { ...data, include: serializeInclude(data.include) },
  });
  return response.data;
}
