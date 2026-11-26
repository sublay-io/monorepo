import { useCallback } from "react";
import useProject from "../projects/useProject";
import { SpaceDetailed, SpaceIncludeParam } from "../../interfaces/models/Space";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface FetchSpaceByShortIdProps {
  shortId: string;
  include?: SpaceIncludeParam;
}

function useFetchSpaceByShortId(): (props: FetchSpaceByShortIdProps) => Promise<SpaceDetailed> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchSpaceByShortId = useCallback(
    async ({
      shortId,
      include,
    }: FetchSpaceByShortIdProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!shortId) {
        throw new SublayError("Please pass a shortId");
      }

      const response = await axios.get(`/${projectId}/spaces/by-short-id`, {
        params: {
          shortId,
          include: Array.isArray(include) ? include.join(",") : include,
        },
      });

      return response.data as SpaceDetailed;
    },
    [projectId]
  );

  return fetchSpaceByShortId;
}

export default useFetchSpaceByShortId;
