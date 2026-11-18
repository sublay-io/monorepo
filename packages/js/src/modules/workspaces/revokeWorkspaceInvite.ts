import { SublayHttpClient } from "../../core/client";

export interface RevokeWorkspaceInviteProps {
  workspaceId: string;
  inviteId: string;
}

/**
 * Revoke a pending invitation. Requires the `invite` capability (or owner).
 * Note the verb-suffixed POST route — this is not a `DELETE`.
 */
export async function revokeWorkspaceInvite(
  client: SublayHttpClient,
  data: RevokeWorkspaceInviteProps
): Promise<void> {
  const { workspaceId, inviteId } = data;
  await client.projectInstance.post<void>(
    `/workspaces/${workspaceId}/invites/${inviteId}/revoke`,
    {}
  );
}
