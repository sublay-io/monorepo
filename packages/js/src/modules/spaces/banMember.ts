import { SublayHttpClient } from "../../core/client";

export interface BanMemberProps {
  spaceId: string;
  /** The member's user id. Your own id is refused (400 `space/own-member-id`). */
  userId: string;
  /** Why the member is banned; kept in the space's ban log. */
  reason?: string;
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
  const { spaceId, userId, reason } = data;
  const response = await client.projectInstance.post<BanMemberResponse>(
    `/spaces/${spaceId}/members/${userId}/ban`,
    { reason }
  );
  return response.data;
}
