import { SublayHttpClient } from "../../core/client";

export interface DeclineWorkspaceInviteProps {
  inviteId: string;
}

/**
 * Decline an invitation — identity-matched to the bearer-token user, and
 * verified-email-gated (the same gate as accept, so an unverified squatter on
 * someone else's address cannot burn their invite). An unverified decline
 * returns `403 workspace/email-not-verified`.
 */
export async function declineWorkspaceInvite(
  client: SublayHttpClient,
  data: DeclineWorkspaceInviteProps
): Promise<void> {
  const { inviteId } = data;
  await client.projectInstance.post<void>(
    `/workspace-invites/${inviteId}/decline`,
    {}
  );
}
