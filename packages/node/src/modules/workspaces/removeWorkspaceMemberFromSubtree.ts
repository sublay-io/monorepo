import { SublayHttpClient } from "../../core/client";
import { RemoveWorkspaceMemberFromSubtreeResponse } from "../../interfaces/Workspace";

export interface RemoveWorkspaceMemberFromSubtreeProps {
  workspaceId: string;
  // The user to offboard from this node and every descendant (path param).
  targetUserId: string;
  // The acting user (requires `remove-member`, rank-bounded per node). Required
  // for the service key (act-as-user) — there is no unbounded path on this
  // route, and the sweep only reaches what THIS user reaches. Name the owner
  // for a full-subtree sweep.
  actingUserId: string;
}

/**
 * Removes the target user's direct memberships on this workspace and every
 * descendant. Rejects with 409 `workspace/owns-descendants` (nothing removed)
 * if the user OWNS this workspace or a descendant. Owned workspaces the acting
 * user has standing on always count and are named; ones they have no standing
 * on count only when the target holds a membership this call would remove,
 * and are listed as `{ id: null, name: null }` after the named ones. The 409
 * body carries `ownedWorkspaces: { id: string | null; name: string | null }[]`
 * and `ownedCount` (its length). An owner must transfer or delete those first.
 *
 * The response also carries `skippedCount` / `skipped` (memberships the sweep
 * could NOT reach). These reflect the ACTING USER, not the key: `actingUserId`
 * is required here, so the sweep is scoped to that user's per-node reach and a
 * sealed descendant they cannot reach is left standing. Name the workspace
 * OWNER for a guaranteed full sweep, and always assert on `skippedCount` rather
 * than reading `removedCount` alone.
 */
export async function removeWorkspaceMemberFromSubtree(
  client: SublayHttpClient,
  data: RemoveWorkspaceMemberFromSubtreeProps
): Promise<RemoveWorkspaceMemberFromSubtreeResponse> {
  const { workspaceId, targetUserId, actingUserId } = data;
  const response =
    await client.projectInstance.post<RemoveWorkspaceMemberFromSubtreeResponse>(
      `/workspaces/${workspaceId}/members/${targetUserId}/remove-from-subtree`,
      { actingUserId }
    );
  return response.data;
}
