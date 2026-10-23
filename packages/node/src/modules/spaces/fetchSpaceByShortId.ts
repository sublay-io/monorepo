import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { SpaceDetailed, SpaceIncludeParam } from "../../interfaces/Space";

export interface FetchSpaceByShortIdProps {
  shortId: string;
  /** Associations to expand. Pass `"files"` for the avatar and banner file objects. */
  include?: SpaceIncludeParam;
  /**
   * Read as this user (service key only): exactly what their own access token
   * would get (their role, member permissions and `isMember`). Omit it for the anonymous view.
   */
  actingUserId?: string;
}

export async function fetchSpaceByShortId(
  client: SublayHttpClient,
  data: FetchSpaceByShortIdProps
): Promise<SpaceDetailed> {
  const response = await client.projectInstance.get<SpaceDetailed>(
    "/spaces/by-short-id",
    { params: { ...data, include: serializeInclude(data.include) } }
  );
  return response.data;
}
