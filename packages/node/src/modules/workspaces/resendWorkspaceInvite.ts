import { SublayHttpClient } from "../../core/client";
import { WorkspaceInvitation } from "../../interfaces/Workspace";

export interface ResendWorkspaceInviteProps {
  workspaceId: string;
  inviteId: string;
  // The user this request acts as. Required: the request resolves and is
  // checked against THEIR authority, exactly as their own token would be.
  //
  // Here that means the `invite` capability is required OF THEM: a key acting
  // as a user without it gets the same 403 that user would.
  actingUserId: string;
}

/**
 * Resend / refresh a pending invitation (valid on any `pending` invite, even one
 * past `expiresAt` — resets a 14-day expiry and resends the email). A terminal
 * invite (accepted/declined/revoked) → 409. Requires `invite` (or owner).
 */
export async function resendWorkspaceInvite(
  client: SublayHttpClient,
  data: ResendWorkspaceInviteProps
): Promise<WorkspaceInvitation> {
  const { workspaceId, inviteId, ...body } = data;
  const response = await client.projectInstance.post<WorkspaceInvitation>(
    `/workspaces/${workspaceId}/invites/${inviteId}/resend`,
    body
  );
  return response.data;
}
