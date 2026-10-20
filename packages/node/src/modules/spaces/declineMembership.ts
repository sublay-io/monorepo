import { SublayHttpClient } from "../../core/client";
import { DeclineMemberResponse } from "../../interfaces/Space";

export interface DeclineMembershipProps {
  spaceId: string;
  memberId: string;
  /**
   * The user this request acts as. The request has exactly that user's
   * permissions in the space and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export async function declineMembership(
  client: SublayHttpClient,
  data: DeclineMembershipProps
): Promise<DeclineMemberResponse> {
  const { spaceId, memberId, actingUserId } = data;
  const response = await client.projectInstance.patch<DeclineMemberResponse>(
    `/spaces/${spaceId}/members/${memberId}/decline`,
    { actingUserId }
  );
  return response.data;
}
