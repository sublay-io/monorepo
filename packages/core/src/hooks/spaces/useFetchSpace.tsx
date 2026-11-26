import { useCallback } from "react";
import useProject from "../projects/useProject";
import { SpaceDetailed, SpaceIncludeParam } from "../../interfaces/models/Space";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface FetchSpaceProps {
  spaceId: string;
  include?: SpaceIncludeParam;
}

function useFetchSpace(): (props: FetchSpaceProps) => Promise<SpaceDetailed> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchSpace = useCallback(
    async ({
      spaceId,
      include,
    }: FetchSpaceProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!spaceId) {
        throw new SublayError("Please pass a spaceId");
      }

      const response = await axios.get(`/${projectId}/spaces/${spaceId}`, {
        params: {
          include: Array.isArray(include) ? include.join(",") : include,
        },
      });

      return response.data as SpaceDetailed;
    },
    [projectId]
  );

  return fetchSpace;
}

export default useFetchSpace;
