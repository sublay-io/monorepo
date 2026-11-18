import { SublayHttpClient } from "../../core/client";
import { SpaceMember } from "../../interfaces/SpaceMember";

export interface ApproveMembershipProps {
  spaceId: string;
  /** The member's user id. Your own id is refused (400 `space/own-member-id`). */
  userId: string;
}

export async function approveMembership(
  client: SublayHttpClient,
  data: ApproveMembershipProps
): Promise<SpaceMember> {
  const { spaceId, userId } = data;
  const response = await client.projectInstance.post<SpaceMember>(
    `/spaces/${spaceId}/members/${userId}/approve`
  );
  return response.data;
}
