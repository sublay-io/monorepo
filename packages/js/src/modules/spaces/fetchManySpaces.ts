import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { Space, SpaceIncludeParam } from "../../interfaces/Space";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";
import { SpaceSearchParams } from "../../interfaces/SpaceSearch";

export interface FetchManySpacesProps extends SpaceSearchParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "alphabetical" | "members";
  sortDir?: "asc" | "desc";
  /** `"true"`: only spaces the signed-in user is a member of. `"false"` is the same as leaving it out. */
  memberOf?: "true" | "false";
  /**
   * A space id (its child spaces), or `"none"` for top-level spaces only.
   * Left out: spaces at every level.
   */
  parentSpaceId?: string | "none";
  nsfwFilter?: "include-all" | "exclude" | "only";
  include?: SpaceIncludeParam;
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
