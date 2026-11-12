import { SublayHttpClient } from "../../core/client";
import { WorkspaceMember } from "../../interfaces/Workspace";

export interface UpdateMyWorkspaceMembershipProps {
  workspaceId: string;
  /** The new title (trimmed, up to 100 characters); `null` clears it. */
  title: string | null;
}

/**
 * PATCH /workspaces/:workspaceId/members/me — the signed-in user edits their
 * own `title`. Needs no capability. Only `title` is editable here: a member's
 * other fields are edited by a member with the capability, through
 * `updateWorkspaceMember`. The user must hold a member row on this workspace
 * (the owner has none: 404 `workspace/not-found`). Returns the updated member
 * record, as `updateWorkspaceMember` does.
 */
export async function updateMyWorkspaceMembership(
  client: SublayHttpClient,
  data: UpdateMyWorkspaceMembershipProps
): Promise<WorkspaceMember> {
  const { workspaceId, title } = data;
  const response = await client.projectInstance.patch<WorkspaceMember>(
    `/workspaces/${workspaceId}/members/me`,
    { title }
  );
  return response.data;
}
