import { SublayHttpClient } from "../../core/client";
import { SpaceMember } from "../../interfaces/SpaceMember";

export interface JoinSpaceProps {
  spaceId: string;
  actingUserId: string;
}

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
