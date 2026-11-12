import { useCallback } from "react";

import useProject from "../projects/useProject";
import axios from "../../config/axios";

export interface CheckUsernameAvailabilityProps {
  username: string;
}

function useCheckUsernameAvailability(): (props: CheckUsernameAvailabilityProps) => Promise<boolean> {
  const { projectId } = useProject();

  const checkUsernameAvailability = useCallback(
    async ({ username }: CheckUsernameAvailabilityProps) => {
      if (!projectId) {
        throw new Error("No project specified");
      }

      if (!username) {
        throw new Error("Please specify a username");
      }

      const response = await axios.get<{ available: boolean }>(`/${projectId}/users/check-username`, {
        params: { username },
      });

      return response.data.available;
    },
    [projectId]
  );

  return checkUsernameAvailability;
}

export default useCheckUsernameAvailability;
