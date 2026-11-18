import { SublayHttpClient } from "../../core/client";
import { SpaceMember } from "../../interfaces/SpaceMember";

export interface JoinSpaceProps {
  spaceId: string;
}

export async function joinSpace(
  client: SublayHttpClient,
  data: JoinSpaceProps
): Promise<SpaceMember> {
  const { spaceId } = data;
  const response = await client.projectInstance.post<SpaceMember>(
    `/spaces/${spaceId}/join`
  );
  return response.data;
}
