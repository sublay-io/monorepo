import { SublayHttpClient } from "../../core/client";
import { SpaceDetailed } from "../../interfaces/Space";

export interface FetchSpaceByShortIdProps {
  shortId: string;
  /** Comma-separated associations to expand. Pass `"files"` for the avatar and banner file objects. */
  include?: string;
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
    { params: data }
  );
  return response.data;
}
