import { SublayHttpClient } from "../../core/client";
import { SpaceMember } from "../../interfaces/SpaceMember";

export interface DeclineMembershipProps {
  spaceId: string;
  /** The member's user id. Your own id is refused (400 `space/own-member-id`). */
  userId: string;
}

export async function declineMembership(
  client: SublayHttpClient,
  data: DeclineMembershipProps
): Promise<SpaceMember> {
  const { spaceId, userId } = data;
  const response = await client.projectInstance.post<SpaceMember>(
    `/spaces/${spaceId}/members/${userId}/decline`
  );
  return response.data;
}
