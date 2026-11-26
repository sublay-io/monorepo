import { useCallback } from "react";
import useProject from "../projects/useProject";
import { SpaceDetailed, SpaceIncludeParam } from "../../interfaces/models/Space";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface FetchSpaceBySlugProps {
  slug: string;
  include?: SpaceIncludeParam;
}

function useFetchSpaceBySlug(): (props: FetchSpaceBySlugProps) => Promise<SpaceDetailed> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchSpaceBySlug = useCallback(
    async ({
      slug,
      include,
    }: FetchSpaceBySlugProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!slug) {
        throw new SublayError("Please pass a slug");
      }

      const response = await axios.get(`/${projectId}/spaces/by-slug`, {
        params: {
          slug,
          include: Array.isArray(include) ? include.join(",") : include,
        },
      });

      return response.data as SpaceDetailed;
    },
    [projectId]
  );

  return fetchSpaceBySlug;
}

export default useFetchSpaceBySlug;
