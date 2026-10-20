import { SublayHttpClient } from "../../core/client";

export interface UnbanMemberProps {
  spaceId: string;
  memberId: string;
  /**
   * The user this request acts as. The request has exactly that user's
   * permissions in the space and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export interface UnbanMemberResponse {
  message: string;
  membership: {
    id: string;
    status: "active";
  };
}

export async function unbanMember(
  client: SublayHttpClient,
  data: UnbanMemberProps
): Promise<UnbanMemberResponse> {
  const { spaceId, memberId, actingUserId } = data;
  const response = await client.projectInstance.patch<UnbanMemberResponse>(
    `/spaces/${spaceId}/members/${memberId}/unban`,
    { actingUserId }
  );
  return response.data;
}
