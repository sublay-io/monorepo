import { SublayHttpClient } from "../../core/client";

export interface BanMemberProps {
  spaceId: string;
  memberId: string;
  /** Why the member is banned; kept in the space's ban log. */
  reason?: string;
  /**
   * The user this request acts as. The request has exactly that user's
   * permissions in the space and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export interface BanMemberResponse {
  message: string;
  membership: {
    id: string;
    status: "banned";
  };
}

export async function banMember(
  client: SublayHttpClient,
  data: BanMemberProps
): Promise<BanMemberResponse> {
  const { spaceId, memberId, reason, actingUserId } = data;
  const response = await client.projectInstance.patch<BanMemberResponse>(
    `/spaces/${spaceId}/members/${memberId}/ban`,
    { reason, actingUserId }
  );
  return response.data;
}
