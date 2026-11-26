import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { Space, SpaceIncludeParam } from "../../interfaces/models/Space";
import { PaginatedResponse } from "../../interfaces/PaginatedResponse";
import { SublayError } from "../../errors/SublayError";

export interface FetchMutualSpacesProps {
  /** The OTHER user — spaces shared with this user are returned. */
  userId: string;
  page?: number;
  limit?: number;
  include?: SpaceIncludeParam;
}

function useFetchMutualSpaces(): (
  params: FetchMutualSpacesProps
) => Promise<PaginatedResponse<Space>> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchMutualSpaces = useCallback(
    async (params: FetchMutualSpacesProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      const { userId, include, ...rest } = params;

      const response = await axios.get<PaginatedResponse<Space>>(
        `/${projectId}/spaces/mutual/${userId}`,
        {
          params: {
            ...rest,
            include: Array.isArray(include) ? include.join(",") : include,
          },
        }
      );

      return response.data;
    },
    [projectId, axios]
  );

  return fetchMutualSpaces;
}

export default useFetchMutualSpaces;
