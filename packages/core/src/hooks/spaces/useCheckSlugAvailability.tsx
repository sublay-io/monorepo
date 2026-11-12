import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";

export interface CheckSlugAvailabilityProps {
  slug: string;
}

function useCheckSlugAvailability(): (props: CheckSlugAvailabilityProps) => Promise<boolean> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const checkSlugAvailability = useCallback(
    async ({ slug }: CheckSlugAvailabilityProps) => {
      if (!projectId) {
        throw new Error("No project specified");
      }

      if (!slug) {
        throw new Error("Please specify a slug");
      }

      const response = await axios.get<{ available: boolean }>(
        `/${projectId}/spaces/check-slug?slug=${slug}`
      );

      return response.data.available;
    },
    [projectId, axios]
  );

  return checkSlugAvailability;
}

export default useCheckSlugAvailability;
