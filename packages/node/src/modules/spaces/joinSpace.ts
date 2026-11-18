import { SublayHttpClient } from "../../core/client";
import { SpaceMember } from "../../interfaces/SpaceMember";

export interface JoinSpaceProps {
  spaceId: string;
  actingUserId: string;
}

/**
 * Join a space. Answers 201 with the new membership — `active`, or `pending`
 * when the space requires join approval — and 200 with the existing one when
 * the user is already a member or already asked to join. A banned user gets
 * 403 `space/banned`.
 */
export async function joinSpace(
  client: SublayHttpClient,
  data: JoinSpaceProps
): Promise<SpaceMember> {
  const { spaceId, actingUserId } = data;
  const response = await client.projectInstance.post<SpaceMember>(
    `/spaces/${spaceId}/join`,
    { actingUserId }
  );
  return response.data;
}
