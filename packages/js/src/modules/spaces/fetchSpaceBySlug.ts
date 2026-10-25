import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { SpaceDetailed, SpaceIncludeParam } from "../../interfaces/Space";

export interface FetchSpaceBySlugProps {
  slug: string;
  /** Associations to expand. Pass `"files"` for the avatar and banner file objects. */
  include?: SpaceIncludeParam;
}

export async function fetchSpaceBySlug(
  client: SublayHttpClient,
  data: FetchSpaceBySlugProps
): Promise<SpaceDetailed> {
  const response = await client.projectInstance.get<SpaceDetailed>(
    "/spaces/by-slug",
    { params: { ...data, include: serializeInclude(data.include) } }
  );
  return response.data;
}
