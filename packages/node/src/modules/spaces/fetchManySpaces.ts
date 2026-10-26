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
  /**
   * A space id (its child spaces), or `"none"` for top-level spaces only.
   * Left out: spaces at every level.
   */
  parentSpaceId?: string | "none";
  nsfwFilter?: "include-all" | "exclude" | "only";
  include?: SpaceIncludeParam;
  /**
   * List as this user (service key only): exactly what their own access token
   * would get (their membership flags, role and member permissions). Omit it for the anonymous view.
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
