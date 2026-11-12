import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import type { UnbanMemberResponse } from "../../interfaces/models/Space";

export interface UnbanMemberProps {
  spaceId: string;
  /** The member's user id. */
  userId: string;
}

function useUnbanMember(): (props: UnbanMemberProps) => Promise<UnbanMemberResponse> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const unbanMember = useCallback(
    async ({ spaceId, userId }: UnbanMemberProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId || !userId) {
        throw new Error("spaceId and userId are required");
      }

      const response = await axios.post(
        `/${projectId}/spaces/${spaceId}/members/${userId}/unban`
      );

      return response.data as UnbanMemberResponse;
    },
    [projectId]
  );

  return unbanMember;
}

export default useUnbanMember;
