import { SublayHttpClient } from "../../core/client";

export interface RemoveWorkspaceMemberProps {
  workspaceId: string;
  // The member to remove (path param).
  targetUserId: string;
  // The acting user (requires `remove-member`, rank-bounded). Required for the
  // service key (act-as-user).
  actingUserId: string;
}

export async function removeWorkspaceMember(
  client: SublayHttpClient,
  data: RemoveWorkspaceMemberProps
): Promise<void> {
  const { workspaceId, targetUserId, actingUserId } = data;
  // A DELETE takes no body: the acting user goes in the query.
  await client.projectInstance.delete<void>(
    `/workspaces/${workspaceId}/members/${targetUserId}`,
    { params: { actingUserId } }
  );
}
