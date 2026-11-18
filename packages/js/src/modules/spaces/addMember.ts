import { SublayHttpClient } from "../../core/client";
import { SpaceMember } from "../../interfaces/SpaceMember";

export interface AddMemberProps {
  spaceId: string;
  /** The user to add to the space. */
  userId: string;
}

/**
 * Add a user to a space directly: they become an active member at once. The
 * signed-in user must be an active moderator or admin of the space. Answers
 * 201 when the user became an active member now, 200 when they already were;
 * the membership row either way.
 */
export async function addMember(
  client: SublayHttpClient,
  data: AddMemberProps
): Promise<SpaceMember> {
  const { spaceId, userId } = data;
  const response = await client.projectInstance.post<SpaceMember>(
    `/spaces/${spaceId}/members`,
    { userId }
  );
  return response.data;
}
