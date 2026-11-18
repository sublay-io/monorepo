import { SublayHttpClient } from "../../core/client";
import { SpaceMember } from "../../interfaces/SpaceMember";
import { SpaceMemberRole } from "../../interfaces/Space";

export interface UpdateMemberRoleProps {
  spaceId: string;
  /** The member's user id. Your own id is refused (400 `space/own-member-id`). */
  userId: string;
  role: SpaceMemberRole;
}

export async function updateMemberRole(
  client: SublayHttpClient,
  data: UpdateMemberRoleProps
): Promise<SpaceMember> {
  const { spaceId, userId, role } = data;
  const response = await client.projectInstance.patch<SpaceMember>(
    `/spaces/${spaceId}/members/${userId}/role`,
    { role }
  );
  return response.data;
}
