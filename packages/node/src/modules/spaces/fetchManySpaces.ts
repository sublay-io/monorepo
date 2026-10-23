import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { Space, SpaceIncludeParam } from "../../interfaces/Space";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface FetchManySpacesProps {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "alphabetical" | "members";
  sortDir?: "asc" | "desc";
  searchSlug?: string;
  searchName?: string;
  searchDescription?: string;
  searchAny?: string;
  /** Only spaces the viewer is a member of. Needs a viewer (`actingUserId`). */
  memberOf?: "true";
  parentSpaceId?: string | "null";
  nsfwFilter?: "include-all" | "exclude" | "only";
  include?: SpaceIncludeParam;
  /**
   * List as this user (service key only): exactly what their own access token
   * would get (`memberOf`, their role and member permissions). Omit it for the anonymous view.
   */
  actingUserId?: string;
}

export async function fetchManySpaces(
  client: SublayHttpClient,
  data: FetchManySpacesProps
): Promise<PaginatedResponse<Space>> {
  const response = await client.projectInstance.get<PaginatedResponse<Space>>(
    "/spaces",
    { params: { ...data, include: serializeInclude(data.include) } }
  );
  return response.data;
}
