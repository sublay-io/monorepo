import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { SpaceDetailed, SpaceIncludeParam } from "../../interfaces/Space";

export interface FetchSpaceProps {
  spaceId: string;
  /** Associations to expand. Pass `"files"` for the avatar and banner file objects. */
  include?: SpaceIncludeParam;
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
    {
      params: { ...params, include: serializeInclude(params.include) },
    }
  );
  return response.data;
}
