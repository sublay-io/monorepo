import { SublayHttpClient } from "../../core/client";

export interface UnbanMemberProps {
  spaceId: string;
  /** The member's user id. Your own id is refused (400 `space/own-member-id`). */
  userId: string;
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
  const { spaceId, userId } = data;
  const response = await client.projectInstance.post<UnbanMemberResponse>(
    `/spaces/${spaceId}/members/${userId}/unban`
  );
  return response.data;
}
