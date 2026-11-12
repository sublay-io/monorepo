import { useCallback } from "react";
import useProject from "../projects/useProject";
import { SpaceBreadcrumbEntry } from "../../interfaces/SpaceBreadcrumb";
import useAxiosPrivate from "../../config/useAxiosPrivate";

export interface FetchSpaceBreadcrumbProps {
  spaceId: string;
}

/**
 * The path from the top-level space down to the requested one, root first.
 * The requested space is always the last entry, and always visible; spaces
 * above it the viewer can't see are `{ hidden: true }` entries.
 */
function useFetchSpaceBreadcrumb(): (props: FetchSpaceBreadcrumbProps) => Promise<SpaceBreadcrumbEntry[]> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchSpaceBreadcrumb = useCallback(
    async ({ spaceId }: FetchSpaceBreadcrumbProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId) {
        throw new Error("Please pass a spaceId");
      }

      const response = await axios.get<{
        breadcrumb: SpaceBreadcrumbEntry[];
        depth: number;
      }>(
        `/${projectId}/spaces/${spaceId}/breadcrumb`
      );

      return response.data.breadcrumb;
    },
    [projectId, axios]
  );

  return fetchSpaceBreadcrumb;
}

export default useFetchSpaceBreadcrumb;
