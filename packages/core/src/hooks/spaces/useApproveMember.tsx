import { useCallback } from "react";
import useProject from "../projects/useProject";
import { ApproveMemberResponse } from "../../interfaces/models/Space";
import useAxiosPrivate from "../../config/useAxiosPrivate";

export interface ApproveMemberProps {
  spaceId: string;
  /** The member's user id. */
  userId: string;
}

function useApproveMember(): (props: ApproveMemberProps) => Promise<ApproveMemberResponse> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const approveMember = useCallback(
    async ({ spaceId, userId }: ApproveMemberProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId || !userId) {
        throw new Error("spaceId and userId are required");
      }

      const response = await axios.post(
        `/${projectId}/spaces/${spaceId}/members/${userId}/approve`
      );

      return response.data as ApproveMemberResponse;
    },
    [projectId]
  );

  return approveMember;
}

export default useApproveMember;
