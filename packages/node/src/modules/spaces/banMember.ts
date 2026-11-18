import { SublayHttpClient } from "../../core/client";
import { SpaceMember } from "../../interfaces/SpaceMember";

export interface BanMemberProps {
  spaceId: string;
  /** The member's user id. Your own id is refused (400 `space/own-member-id`). */
  userId: string;
  /** Why the member is banned; kept in the space's ban log. */
  reason?: string;
  /**
   * The user this request acts as. The request has exactly that user's
   * permissions in the space and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export async function banMember(
  client: SublayHttpClient,
  data: BanMemberProps
): Promise<SpaceMember> {
  const { spaceId, userId, reason, actingUserId } = data;
  const response = await client.projectInstance.post<SpaceMember>(
    `/spaces/${spaceId}/members/${userId}/ban`,
    { reason, actingUserId }
  );
  return response.data;
}
