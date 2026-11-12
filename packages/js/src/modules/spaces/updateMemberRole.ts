import { SublayHttpClient } from "../../core/client";
import { UpdateMemberRoleResponse, SpaceMemberRole } from "../../interfaces/Space";

export interface UpdateMemberRoleProps {
  spaceId: string;
  /** The member's user id. Your own id is refused (400 `space/own-member-id`). */
  userId: string;
  role: SpaceMemberRole;
}

export async function updateMemberRole(
  client: SublayHttpClient,
  data: UpdateMemberRoleProps
): Promise<UpdateMemberRoleResponse> {
  const { spaceId, userId, role } = data;
  const response = await client.projectInstance.patch<UpdateMemberRoleResponse>(
    `/spaces/${spaceId}/members/${userId}/role`,
    { role }
  );
  return response.data;
}
