import { SublayHttpClient } from "../../core/client";
import { Workspace } from "../../interfaces/Workspace";

export interface FetchWorkspaceProps {
  workspaceId: string;
  // Comma-separated include flags. `memberCount` adds the workspace's DIRECT
  // member count to the response; omit it and the field is absent. The same
  // flag works on `fetchManyWorkspaces`. An unrecognized flag is ignored.
  include?: string;
  // Act as a named user (service key only): visibility resolves against them,
  // exactly as their own token would. Omit it and the request gets the
  // anonymous view, which is always a 404.
  //
  // A user with no relation to the workspace gets the same 404.
  actingUserId?: string;
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
