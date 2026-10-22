import { SublayHttpClient } from "../../core/client";

export interface RevokeWorkspaceInviteProps {
  workspaceId: string;
  inviteId: string;
  // The user this request acts as. Required: the request resolves and is
  // checked against THEIR authority, exactly as their own token would be.
  //
  // Here that means the `invite` capability is required OF THEM: a key acting
  // as a user without it gets the same 403 that user would.
  actingUserId: string;
}

export interface RevokeWorkspaceInviteResponse {
  success: boolean;
}

/** Revoke a pending invitation. Requires the `invite` capability (or owner). */
export async function revokeWorkspaceInvite(
  client: SublayHttpClient,
  data: RevokeWorkspaceInviteProps
): Promise<RevokeWorkspaceInviteResponse> {
  const { workspaceId, inviteId, ...body } = data;
  const response = await client.projectInstance.post<RevokeWorkspaceInviteResponse>(
    `/workspaces/${workspaceId}/invites/${inviteId}/revoke`,
    body
  );
  return response.data;
}
