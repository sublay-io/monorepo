import { SublayHttpClient } from "../../core/client";

export interface DeleteWorkspaceProps {
  workspaceId: string;
  // Owner-only delete; the acting user (own owner or an ancestor owner).
  actingUserId: string;
}

export async function deleteWorkspace(
  client: SublayHttpClient,
  data: DeleteWorkspaceProps
): Promise<void> {
  const { workspaceId, actingUserId } = data;
  // A DELETE takes no body: the acting user goes in the query.
  await client.projectInstance.delete<void>(
    `/workspaces/${workspaceId}`,
    { params: { actingUserId } }
  );
}
