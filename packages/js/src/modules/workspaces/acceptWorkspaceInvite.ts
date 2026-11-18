import { SublayHttpClient } from "../../core/client";
import { WorkspaceMemberStanding } from "../../interfaces/Workspace";

export interface AcceptWorkspaceInviteProps {
  inviteId: string;
}

/**
 * Accept an invitation — identity-matched to the bearer-token user + verified
 * email required. Non-secret id.
 *
 * Resolves to the user's standing in the workspace — the same record
 * `fetchMyWorkspaceMembership` returns. The server answers 201 when the accept
 * made the user a member, and 200 when they already were (or own the
 * workspace), including a repeat accept of an invite they already accepted.
 * An invite that is revoked, declined, expired, accepted by someone else, or
 * accepted by a user who has since left fails with 409 `workspace/not-pending`.
 */
export async function acceptWorkspaceInvite(
  client: SublayHttpClient,
  data: AcceptWorkspaceInviteProps
): Promise<WorkspaceMemberStanding> {
  const { inviteId } = data;
  const response = await client.projectInstance.post<WorkspaceMemberStanding>(
    `/workspace-invites/${inviteId}/accept`,
    {}
  );
  return response.data;
}
