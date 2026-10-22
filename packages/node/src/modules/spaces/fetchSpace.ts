import { SublayHttpClient } from "../../core/client";
import { SpaceDetailed } from "../../interfaces/Space";

export interface FetchSpaceProps {
  spaceId: string;
  /**
   * Read as this user (service key only): exactly what their own access token
   * would get (their role, member permissions and `isMember`). Omit it for the anonymous view.
   */
  actingUserId?: string;
}

export async function fetchSpace(
  client: SublayHttpClient,
  data: FetchSpaceProps
): Promise<SpaceDetailed> {
  const { spaceId, ...params } = data;
  const response = await client.projectInstance.get<SpaceDetailed>(
    `/spaces/${spaceId}`,
    { params }
  );
  return response.data;
}
