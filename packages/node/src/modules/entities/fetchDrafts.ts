import { SublayHttpClient } from "../../core/client";
import { DraftIncludeParam, Entity } from "../../interfaces/Entity";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface FetchDraftsProps {
  actingUserId: string;
  page?: number;
  limit?: number;
  /** Only drafts from this source, or `"none"` for drafts with no source. Left out: any source. */
  sourceId?: string | "none";
  /** Only drafts in this space, or `"none"` for drafts in no space. Left out: any space, or none. */
  spaceId?: string | "none";
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
