import { useCallback } from "react";
import type { SpaceMember } from "../../interfaces/models/SpaceMember";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface ApproveMemberProps {
  spaceId: string;
  /** The member's user id. */
  userId: string;
}

function useApproveMember(): (props: ApproveMemberProps) => Promise<SpaceMember> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const approveMember = useCallback(
    async ({ spaceId, userId }: ApproveMemberProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!spaceId || !userId) {
        throw new SublayError("spaceId and userId are required");
      }

      const response = await axios.post(
        `/${projectId}/spaces/${spaceId}/members/${userId}/approve`
      );

      return response.data as SpaceMember;
    },
    [projectId]
  );

  return approveMember;
}

export default useApproveMember;
