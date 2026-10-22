import { SublayHttpClient } from "../../core/client";
import { JoinSpaceResponse } from "../../interfaces/Space";

export interface JoinSpaceProps {
  spaceId: string;
  actingUserId: string;
}

export async function joinSpace(
  client: SublayHttpClient,
  data: JoinSpaceProps
): Promise<JoinSpaceResponse> {
  const { spaceId, actingUserId } = data;
  const response = await client.projectInstance.post<JoinSpaceResponse>(
    `/spaces/${spaceId}/join`,
    { actingUserId }
  );
  return response.data;
}
