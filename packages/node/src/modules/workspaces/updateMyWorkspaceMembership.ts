import { SublayHttpClient } from "../../core/client";
import { WorkspaceMember } from "../../interfaces/Workspace";

export interface UpdateMyWorkspaceMembershipProps {
  workspaceId: string;
  /** The user whose own membership to edit: the request acts as them. Required. */
  actingUserId: string;
  /** The new title (trimmed, up to 100 characters); `null` clears it. */
  title: string | null;
}

/**
 * PATCH /workspaces/:workspaceId/members/me — the acting user edits their own
 * `title`. Needs no capability. Only `title` is editable here: a member's
 * other fields are edited by a member with the capability, through
 * `updateWorkspaceMember`. The acting user must hold a member row on this
 * workspace (the owner has none: 404 `workspace/not-found`). Returns the
 * updated member record, as `updateWorkspaceMember` does.
 */
export async function updateMyWorkspaceMembership(
  client: SublayHttpClient,
  data: UpdateMyWorkspaceMembershipProps
): Promise<WorkspaceMember> {
  const { workspaceId, actingUserId, title } = data;
  const response = await client.projectInstance.patch<WorkspaceMember>(
    `/workspaces/${workspaceId}/members/me`,
    { actingUserId, title }
  );
  return response.data;
}
