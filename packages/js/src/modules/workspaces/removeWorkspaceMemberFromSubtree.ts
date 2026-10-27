import { SublayHttpClient } from "../../core/client";
import {
  RemoveWorkspaceMemberFromSubtreeResponse,
} from "../../interfaces/Workspace";

export interface RemoveWorkspaceMemberFromSubtreeProps {
  workspaceId: string;
  // The user to offboard from this node and every descendant (path param — the
  // TARGET, not the actor).
  targetUserId: string;
}

/**
 * Removes the target user's direct memberships on this workspace and every
 * descendant. Requires `remove-member` (rank-bounded per node). Rejects with
 * 409 `workspace/owns-descendants` (nothing removed) if the user OWNS this
 * workspace or a descendant. Owned workspaces the actor has standing on always
 * count and are named; ones the actor has no standing on count only when the
 * target holds a membership this call would remove, and are listed as
 * `{ id: null, name: null }` after the named ones. The 409 body carries
 * `ownedWorkspaces: { id: string | null; name: string | null }[]` and
 * `ownedCount` (its length). An owner must transfer or delete those first. The actor comes
 * from the token.
 *
 * A NON-owner's sweep can be PARTIAL: it stops at sealed sub-workspaces. Check
 * `skippedCount` / `skipped` before treating the user as fully offboarded.
 */
export async function removeWorkspaceMemberFromSubtree(
  client: SublayHttpClient,
  data: RemoveWorkspaceMemberFromSubtreeProps
): Promise<RemoveWorkspaceMemberFromSubtreeResponse> {
  const { workspaceId, targetUserId } = data;
  const response =
    await client.projectInstance.post<RemoveWorkspaceMemberFromSubtreeResponse>(
      `/workspaces/${workspaceId}/members/${targetUserId}/remove-from-subtree`,
      {}
    );
  return response.data;
}
