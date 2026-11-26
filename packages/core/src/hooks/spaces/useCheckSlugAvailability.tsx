import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface CheckSlugAvailabilityProps {
  slug: string;
}

function useCheckSlugAvailability(): (props: CheckSlugAvailabilityProps) => Promise<boolean> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const checkSlugAvailability = useCallback(
    async ({ slug }: CheckSlugAvailabilityProps) => {
      if (!projectId) {
        throw new SublayError("No project specified");
      }

      if (!slug) {
        throw new SublayError("Please specify a slug");
      }

      const response = await axios.get<{ available: boolean }>(
        `/${projectId}/spaces/check-slug`,
        { params: { slug } }
      );

      return response.data.available;
    },
    [projectId, axios]
  );

  return checkSlugAvailability;
}

export default useCheckSlugAvailability;
