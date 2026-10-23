import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { SpaceDetailed, SpaceIncludeParam } from "../../interfaces/Space";

export interface FetchSpaceProps {
  spaceId: string;
  /** Associations to expand. Pass `"files"` for the avatar and banner file objects. */
  include?: SpaceIncludeParam;
}

export async function fetchSpace(
  client: SublayHttpClient,
  data: FetchSpaceProps
): Promise<SpaceDetailed> {
  const { spaceId, include } = data;
  const response = await client.projectInstance.get<SpaceDetailed>(
    `/spaces/${spaceId}`,
    { params: include ? { include: serializeInclude(include) } : undefined }
  );
  return response.data;
}
