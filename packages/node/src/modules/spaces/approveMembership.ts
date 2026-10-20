import { SublayHttpClient } from "../../core/client";
import { ApproveMemberResponse } from "../../interfaces/Space";

export interface ApproveMembershipProps {
  spaceId: string;
  memberId: string;
  /**
   * The user this request acts as. The request has exactly that user's
   * permissions in the space and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export async function approveMembership(
  client: SublayHttpClient,
  data: ApproveMembershipProps
): Promise<ApproveMemberResponse> {
  const { spaceId, memberId, actingUserId } = data;
  const response = await client.projectInstance.patch<ApproveMemberResponse>(
    `/spaces/${spaceId}/members/${memberId}/approve`,
    { actingUserId }
  );
  return response.data;
}
