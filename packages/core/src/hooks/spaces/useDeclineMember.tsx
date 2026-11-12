import { useCallback } from "react";
import useProject from "../projects/useProject";
import { DeclineMemberResponse } from "../../interfaces/models/Space";
import useAxiosPrivate from "../../config/useAxiosPrivate";

export interface DeclineMemberProps {
  spaceId: string;
  /** The member's user id. */
  userId: string;
}

function useDeclineMember(): (props: DeclineMemberProps) => Promise<DeclineMemberResponse> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const declineMember = useCallback(
    async ({ spaceId, userId }: DeclineMemberProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId || !userId) {
        throw new Error("spaceId and userId are required");
      }

      const response = await axios.post(
        `/${projectId}/spaces/${spaceId}/members/${userId}/decline`
      );

      return response.data as DeclineMemberResponse;
    },
    [projectId]
  );

  return declineMember;
}

export default useDeclineMember;
