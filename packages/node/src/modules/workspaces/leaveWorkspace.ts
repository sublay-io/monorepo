import { SublayHttpClient } from "../../core/client";

export interface LeaveWorkspaceProps {
  workspaceId: string;
  // The user leaving this workspace. Required for the service key (act-as-user):
  // removes THIS user's direct membership on this node only.
  actingUserId: string;
}

/**
 * The acting user leaves this workspace (their direct membership on this node
 * only). An owner cannot leave (409 `workspace/sole-owner`): transfer ownership
 * or remove the workspace first. A user who only reaches in, with no direct
 * membership here, gets 403 `workspace/not-member`; one who can't see the
 * workspace at all gets 404 `workspace/not-found`, as for a missing one.
 */
export async function leaveWorkspace(
  client: SublayHttpClient,
  data: LeaveWorkspaceProps
): Promise<void> {
  const { workspaceId, actingUserId } = data;
  // A DELETE takes no body: the acting user goes in the query.
  await client.projectInstance.delete<void>(
    `/workspaces/${workspaceId}/members/me`,
    { params: { actingUserId } }
  );
}
