import { SublayHttpClient } from "../../core/client";
import { SpaceDetailed } from "../../interfaces/Space";

export interface FetchSpaceBySlugProps {
  slug: string;
  /** Comma-separated associations to expand. Pass `"files"` for the avatar and banner file objects. */
  include?: string;
  /**
   * Read as this user (service key only): exactly what their own access token
   * would get (their role, member permissions and `isMember`). Omit it for the anonymous view.
   */
  actingUserId?: string;
}

export async function fetchSpaceBySlug(
  client: SublayHttpClient,
  data: FetchSpaceBySlugProps
): Promise<SpaceDetailed> {
  const response = await client.projectInstance.get<SpaceDetailed>(
    "/spaces/by-slug",
    { params: data }
  );
  return response.data;
}
