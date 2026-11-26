import { useCallback } from "react";
import type { SpaceMember } from "../../interfaces/models/SpaceMember";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface DeclineMemberProps {
  spaceId: string;
  /** The member's user id. */
  userId: string;
}

function useDeclineMember(): (props: DeclineMemberProps) => Promise<SpaceMember> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const declineMember = useCallback(
    async ({ spaceId, userId }: DeclineMemberProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!spaceId || !userId) {
        throw new SublayError("spaceId and userId are required");
      }

      const response = await axios.post(
        `/${projectId}/spaces/${spaceId}/members/${userId}/decline`
      );

      return response.data as SpaceMember;
    },
    [projectId]
  );

  return declineMember;
}

export default useDeclineMember;
