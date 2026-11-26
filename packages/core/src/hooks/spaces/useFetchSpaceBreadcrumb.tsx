import { useCallback } from "react";
import useProject from "../projects/useProject";
import { SpaceBreadcrumb } from "../../interfaces/SpaceBreadcrumb";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface FetchSpaceBreadcrumbProps {
  spaceId: string;
}

/**
 * The path from the top-level space down to the requested one, root first,
 * plus the requested space's depth. The requested space is always the last
 * entry, and always visible; spaces above it the viewer can't see are
 * `{ hidden: true }` entries.
 */
function useFetchSpaceBreadcrumb(): (
  props: FetchSpaceBreadcrumbProps
) => Promise<SpaceBreadcrumb> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchSpaceBreadcrumb = useCallback(
    async ({ spaceId }: FetchSpaceBreadcrumbProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!spaceId) {
        throw new SublayError("Please pass a spaceId");
      }

      const response = await axios.get<SpaceBreadcrumb>(
        `/${projectId}/spaces/${spaceId}/breadcrumb`
      );

      return response.data;
    },
    [projectId, axios]
  );

  return fetchSpaceBreadcrumb;
}

export default useFetchSpaceBreadcrumb;
