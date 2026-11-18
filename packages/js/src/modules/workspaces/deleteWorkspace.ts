import { SublayHttpClient } from "../../core/client";

export interface DeleteWorkspaceProps {
  workspaceId: string;
}

/**
 * Owner-only delete (own owner or an ancestor owner). Cascades the whole
 * subtree transactionally. The actor is the bearer-token user — no actor
 * field is sent.
 */
export async function deleteWorkspace(
  client: SublayHttpClient,
  data: DeleteWorkspaceProps
): Promise<void> {
  const { workspaceId } = data;
  await client.projectInstance.delete<void>(
    `/workspaces/${workspaceId}`
  );
}
