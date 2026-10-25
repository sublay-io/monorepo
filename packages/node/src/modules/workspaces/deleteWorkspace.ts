import { SublayHttpClient } from "../../core/client";

export interface DeleteWorkspaceProps {
  workspaceId: string;
  // Owner-only delete; the acting user (own owner or an ancestor owner).
  actingUserId: string;
}

export interface DeleteWorkspaceResponse {
  message: string;
}

export async function deleteWorkspace(
  client: SublayHttpClient,
  data: DeleteWorkspaceProps
): Promise<DeleteWorkspaceResponse> {
  const { workspaceId, actingUserId } = data;
  // A DELETE takes no body: the acting user goes in the query.
  const response = await client.projectInstance.delete<DeleteWorkspaceResponse>(
    `/workspaces/${workspaceId}`,
    { params: { actingUserId } }
  );
  return response.data;
}
