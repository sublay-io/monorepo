import { SublayHttpClient } from "../../core/client";
import { AddMemberResponse } from "../../interfaces/Space";

export interface AddMemberProps {
  spaceId: string;
  /** The user to add to the space. */
  userId: string;
  /**
   * The user this request acts as: an active moderator or admin of the space.
   * The request has exactly that user's permissions in the space and is
   * recorded as theirs. Required.
   */
  actingUserId: string;
}

/**
 * Add a user to a space directly: they become an active member at once.
 */
export async function addMember(
  client: SublayHttpClient,
  data: AddMemberProps
): Promise<AddMemberResponse> {
  const { spaceId, userId, actingUserId } = data;
  const response = await client.projectInstance.post<AddMemberResponse>(
    `/spaces/${spaceId}/members`,
    { userId, actingUserId }
  );
  return response.data;
}
