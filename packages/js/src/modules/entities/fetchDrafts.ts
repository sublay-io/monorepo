import { SublayHttpClient } from "../../core/client";
import { DraftIncludeParam, Entity } from "../../interfaces/Entity";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface FetchDraftsProps {
  page?: number;
  limit?: number;
  sourceId?: string;
  spaceId?: string;
  include?: DraftIncludeParam;
}

export async function fetchDrafts(
  client: SublayHttpClient,
  data: FetchDraftsProps
): Promise<PaginatedResponse<Entity>> {
  const response = await client.projectInstance.get<PaginatedResponse<Entity>>(
    "/entities/drafts",
    {
      params: {
        ...data,
        include: Array.isArray(data.include)
          ? data.include.join(",")
          : data.include,
      },
    }
  );
  return response.data;
}
