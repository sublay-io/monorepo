import { SublayHttpClient } from "../../core/client";
import { ApproveMemberResponse } from "../../interfaces/Space";

export interface ApproveMembershipProps {
  spaceId: string;
  /** The member's user id. Your own id is refused (400 `space/own-member-id`). */
  userId: string;
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
  const { spaceId, userId, actingUserId } = data;
  const response = await client.projectInstance.post<ApproveMemberResponse>(
    `/spaces/${spaceId}/members/${userId}/approve`,
    { actingUserId }
  );
  return response.data;
}
