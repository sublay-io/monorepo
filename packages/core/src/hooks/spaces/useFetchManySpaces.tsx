import { useCallback } from "react";
import { buildSearchParams } from "../../utils/searchParams";
import type { SpaceSearchFields } from "../../interfaces/SpaceSearch";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { Space, SpaceIncludeParam } from "../../interfaces/models/Space";
import { PaginatedResponse } from "../../interfaces/PaginatedResponse";
import { SpaceListSortByOptions } from "../../interfaces/SpaceListSortByOptions";
import { NsfwFilter } from "../../interfaces/NsfwFilter";

export interface FetchManySpacesProps {
  page?: number;
  limit?: number;
  sortBy?: SpaceListSortByOptions;
  sortDir?: "asc" | "desc";
  query?: string | null;
  searchFields?: SpaceSearchFields | null;
  memberOf?: boolean;
  parentSpaceId?: string | null;
  nsfwFilter?: NsfwFilter | null;
  include?: SpaceIncludeParam;
}

function useFetchManySpaces(): (params?: FetchManySpacesProps) => Promise<PaginatedResponse<Space>> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchManySpaces = useCallback(
    async (params?: FetchManySpacesProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      const queryParams: Record<string, any> = {};

      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.sortBy) queryParams.sortBy = params.sortBy;
      if (params?.sortDir) queryParams.sortDir = params.sortDir;
      Object.assign(queryParams, buildSearchParams(params?.query, params?.searchFields));
      // Sent as "true" / "false"; "false" lists the same as leaving it out.
      if (typeof params?.memberOf === "boolean") queryParams.memberOf = String(params.memberOf);
      if (params?.parentSpaceId !== undefined) queryParams.parentSpaceId = params.parentSpaceId || "null";
      if (params?.nsfwFilter) queryParams.nsfwFilter = params.nsfwFilter;
      if (params?.include) {
        queryParams.include = Array.isArray(params.include)
          ? params.include.join(",")
          : params.include;
      }

      const response = await axios.get<PaginatedResponse<Space>>(
        `/${projectId}/spaces`,
        {
          params: queryParams,
        }
      );

      return response.data;
    },
    [projectId, axios]
  );

  return fetchManySpaces;
}

export default useFetchManySpaces;
