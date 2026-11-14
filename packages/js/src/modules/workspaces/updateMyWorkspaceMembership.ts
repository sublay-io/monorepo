import { SublayHttpClient } from "../../core/client";
import { WorkspaceMember } from "../../interfaces/Workspace";

export interface UpdateMyWorkspaceMembershipProps {
  workspaceId: string;
  /**
   * The new title (trimmed, up to 100 characters); `null` clears it. Required
   * for a member; the owner sends `title`, `metadata` or both.
   */
  title?: string | null;
  /**
   * The workspace's owner only: replaces their metadata. A member who sends it
   * gets 400 `workspace/unsupported-param`.
   */
  metadata?: Record<string, any>;
}

/**
 * PATCH /workspaces/:workspaceId/members/me — the signed-in user edits their own
 * profile. Needs no capability. A member edits their `title` only: their other
 * fields are edited by a member with the capability, through
 * `updateWorkspaceMember`. The workspace's owner edits their `title` and
 * `metadata` here, and only here. A user with no member row who is not the
 * owner gets 404 `workspace/not-found`. Returns the updated member record, as
 * `updateWorkspaceMember` does; for the owner it holds the profile only
 * (`rank: null`, no capabilities or permissions).
 */
export async function updateMyWorkspaceMembership(
  client: SublayHttpClient,
  data: UpdateMyWorkspaceMembershipProps
): Promise<WorkspaceMember> {
  const { workspaceId, title, metadata } = data;
  const response = await client.projectInstance.patch<WorkspaceMember>(
    `/workspaces/${workspaceId}/members/me`,
    { title, metadata }
  );
  return response.data;
}
