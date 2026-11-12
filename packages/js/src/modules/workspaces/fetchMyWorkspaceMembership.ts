import { SublayHttpClient } from "../../core/client";
import { WorkspaceMemberStanding } from "../../interfaces/Workspace";

export interface FetchMyWorkspaceMembershipProps {
  workspaceId: string;
}

/**
 * GET /workspaces/:workspaceId/members/me — the signed-in user's own resolved
 * standing on a workspace: the same record `fetchWorkspaceMemberStanding`
 * returns, never fenced. A user with no relation to the workspace gets
 * `reasons: []`. `relativeRank` is `0` when they hold a membership row, `null`
 * for an owner without one.
 */
export async function fetchMyWorkspaceMembership(
  client: SublayHttpClient,
  data: FetchMyWorkspaceMembershipProps
): Promise<WorkspaceMemberStanding> {
  const { workspaceId } = data;
  const response = await client.projectInstance.get<WorkspaceMemberStanding>(
    `/workspaces/${workspaceId}/members/me`
  );
  return response.data;
}
