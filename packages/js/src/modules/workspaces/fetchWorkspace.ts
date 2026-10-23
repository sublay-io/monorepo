import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { Workspace, WorkspaceIncludeParam } from "../../interfaces/Workspace";

export interface FetchWorkspaceProps {
  workspaceId: string;
  // Include flags. `memberCount` adds the workspace's DIRECT
  // member count to the response; omit it and the field is absent. The same
  // flag works on `fetchManyWorkspaces`. An unknown flag is a 400.
  include?: WorkspaceIncludeParam;
}

export async function fetchWorkspace(
  client: SublayHttpClient,
  data: FetchWorkspaceProps
): Promise<Workspace> {
  const { workspaceId, include } = data;
  const response = await client.projectInstance.get<Workspace>(
    `/workspaces/${workspaceId}`,
    { params: include ? { include: serializeInclude(include) } : undefined }
  );
  return response.data;
}
