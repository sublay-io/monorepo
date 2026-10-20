import { SublayHttpClient } from "../../core/client";
import { UpdateMemberRoleResponse, SpaceMemberRole } from "../../interfaces/Space";

export interface UpdateMemberRoleProps {
  spaceId: string;
  memberId: string;
  role: SpaceMemberRole;
  /**
   * The user this request acts as. The request has exactly that user's
   * permissions in the space and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export async function updateMemberRole(
  client: SublayHttpClient,
  data: UpdateMemberRoleProps
): Promise<UpdateMemberRoleResponse> {
  const { spaceId, memberId, role, actingUserId } = data;
  const response = await client.projectInstance.patch<UpdateMemberRoleResponse>(
    `/spaces/${spaceId}/members/${memberId}/role`,
    { role, actingUserId }
  );
  return response.data;
}
