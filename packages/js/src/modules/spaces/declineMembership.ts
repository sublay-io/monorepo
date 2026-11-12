import { SublayHttpClient } from "../../core/client";
import { DeclineMemberResponse } from "../../interfaces/Space";

export interface DeclineMembershipProps {
  spaceId: string;
  /** The member's user id. Your own id is refused (400 `space/own-member-id`). */
  userId: string;
}

export async function declineMembership(
  client: SublayHttpClient,
  data: DeclineMembershipProps
): Promise<DeclineMemberResponse> {
  const { spaceId, userId } = data;
  const response = await client.projectInstance.post<DeclineMemberResponse>(
    `/spaces/${spaceId}/members/${userId}/decline`
  );
  return response.data;
}
