import { SublayHttpClient } from "../../core/client";
import { Workspace } from "../../interfaces/Workspace";

export interface FetchWorkspaceProps {
  workspaceId: string;
  // Comma-separated include flags. `memberCount` adds the workspace's DIRECT
  // member count to the response; omit it and the field is absent. The same
  // flag works on `fetchManyWorkspaces`. An unrecognized flag is ignored.
  include?: string;
  // The user this request acts as. Required: visibility resolves against
  // them, exactly as their own token would, so a user with no relation to the
  // workspace gets a 404. (The server gives a key naming nobody the anonymous
  // view, which for a workspace is always a 404.)
  actingUserId: string;
}

export async function fetchWorkspace(
  client: SublayHttpClient,
  data: FetchWorkspaceProps
): Promise<Workspace> {
  const { workspaceId, ...params } = data;
  const response = await client.projectInstance.get<Workspace>(
    `/workspaces/${workspaceId}`,
    { params }
  );
  return response.data;
}
