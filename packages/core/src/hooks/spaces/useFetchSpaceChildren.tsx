import { useCallback } from "react";
import useProject from "../projects/useProject";
import { Space, SpaceIncludeParam } from "../../interfaces/models/Space";
import { PaginatedResponse } from "../../interfaces/PaginatedResponse";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SpaceListSortByOptions } from "../../interfaces/SpaceListSortByOptions";

export interface FetchSpaceChildrenProps {
  spaceId: string;
  page?: number;
  limit?: number;
  /** Server default `"alphabetical"`. */
  sortBy?: SpaceListSortByOptions;
  sortDir?: "asc" | "desc";
  include?: SpaceIncludeParam;
}

function useFetchSpaceChildren(): (props: FetchSpaceChildrenProps) => Promise<PaginatedResponse<Space>> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchSpaceChildren = useCallback(
    async ({ spaceId, page = 1, limit = 20, sortBy, sortDir, include }: FetchSpaceChildrenProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId) {
        throw new Error("Please pass a spaceId");
      }

      const response = await axios.get<PaginatedResponse<Space>>(
        `/${projectId}/spaces/${spaceId}/children`,
        {
          params: {
            page,
            limit,
            sortBy,
            sortDir,
            include: Array.isArray(include) ? include.join(",") : include,
          },
        }
      );

      return response.data;
    },
    [axios, projectId]
  );

  return fetchSpaceChildren;
}

export default useFetchSpaceChildren;
