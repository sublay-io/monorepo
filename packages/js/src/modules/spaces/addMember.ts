import { SublayHttpClient } from "../../core/client";
import { AddMemberResponse } from "../../interfaces/Space";

export interface AddMemberProps {
  spaceId: string;
  /** The user to add to the space. */
  userId: string;
}

/**
 * Add a user to a space directly: they become an active member at once. The
 * signed-in user must be an active moderator or admin of the space.
 */
export async function addMember(
  client: SublayHttpClient,
  data: AddMemberProps
): Promise<AddMemberResponse> {
  const { spaceId, userId } = data;
  const response = await client.projectInstance.post<AddMemberResponse>(
    `/spaces/${spaceId}/members`,
    { userId }
  );
  return response.data;
}
