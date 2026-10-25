import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { Space, SpaceIncludeParam } from "../../interfaces/Space";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface FetchChildSpacesProps {
  spaceId: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "alphabetical" | "members";
  sortDir?: "asc" | "desc";
  include?: SpaceIncludeParam;
}

export async function fetchChildSpaces(
  client: SublayHttpClient,
  data: FetchChildSpacesProps
): Promise<PaginatedResponse<Space>> {
  const { spaceId, ...params } = data;
  const response = await client.projectInstance.get<PaginatedResponse<Space>>(
    `/spaces/${spaceId}/children`,
    {
      params: { ...params, include: serializeInclude(params.include) },
    }
  );
  return response.data;
}
