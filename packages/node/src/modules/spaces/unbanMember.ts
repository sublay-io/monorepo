import { SublayHttpClient } from "../../core/client";
import { SpaceMember } from "../../interfaces/SpaceMember";

export interface UnbanMemberProps {
  spaceId: string;
  /** The member's user id. Your own id is refused (400 `space/own-member-id`). */
  userId: string;
  /**
   * The user this request acts as. The request has exactly that user's
   * permissions in the space and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export async function unbanMember(
  client: SublayHttpClient,
  data: UnbanMemberProps
): Promise<SpaceMember> {
  const { spaceId, userId, actingUserId } = data;
  const response = await client.projectInstance.post<SpaceMember>(
    `/spaces/${spaceId}/members/${userId}/unban`,
    { actingUserId }
  );
  return response.data;
}
