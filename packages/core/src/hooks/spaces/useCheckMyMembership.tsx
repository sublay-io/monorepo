import { useCallback } from "react";
import useProject from "../projects/useProject";
import { CheckMyMembershipResponse } from "../../interfaces/models/Space";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface CheckMyMembershipProps {
  spaceId: string;
}

function useCheckMyMembership(): (props: CheckMyMembershipProps) => Promise<CheckMyMembershipResponse> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const checkMyMembership = useCallback(
    async ({ spaceId }: CheckMyMembershipProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!spaceId) {
        throw new SublayError("Please pass a spaceId");
      }

      const response = await axios.get<CheckMyMembershipResponse>(
        `/${projectId}/spaces/${spaceId}/members/me`
      );

      return response.data;
    },
    [projectId, axios]
  );

  return checkMyMembership;
}

export default useCheckMyMembership;
