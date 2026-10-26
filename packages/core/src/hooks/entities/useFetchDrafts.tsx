import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { DraftIncludeParam, Entity } from "../../interfaces/models/Entity";
import { PaginatedResponse } from "../../interfaces/PaginatedResponse";

interface FetchDraftsParams {
  page?: number;
  limit?: number;
  /** Only drafts from this source, or `"none"` for drafts with no source. `null` or left out: any source. */
  sourceId?: string | "none" | null;
  /** Only drafts in this space, or `"none"` for drafts in no space. `null` or left out: any space, or none. */
  spaceId?: string | "none" | null;
  include?: DraftIncludeParam;
}

function useFetchDrafts(): (params?: FetchDraftsParams) => Promise<PaginatedResponse<Entity>> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchDrafts = useCallback(
    async (params?: FetchDraftsParams) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      const queryParams: Record<string, any> = {};

      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.sourceId) queryParams.sourceId = params.sourceId;
      if (params?.spaceId) queryParams.spaceId = params.spaceId;

      if (params?.include) {
        queryParams.include = Array.isArray(params.include)
          ? params.include.join(",")
          : params.include;
      }

      const response = await axios.get<PaginatedResponse<Entity>>(
        `/${projectId}/entities/drafts`,
        { params: queryParams }
      );

      return response.data;
    },
    [projectId, axios]
  );

  return fetchDrafts;
}

export default useFetchDrafts;
