import { useCallback } from "react";
import type { SpaceMember } from "../../interfaces/models/SpaceMember";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface UnbanMemberProps {
  spaceId: string;
  /** The member's user id. */
  userId: string;
}

function useUnbanMember(): (props: UnbanMemberProps) => Promise<SpaceMember> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const unbanMember = useCallback(
    async ({ spaceId, userId }: UnbanMemberProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!spaceId || !userId) {
        throw new SublayError("spaceId and userId are required");
      }

      const response = await axios.post(
        `/${projectId}/spaces/${spaceId}/members/${userId}/unban`
      );

      return response.data as SpaceMember;
    },
    [projectId]
  );

  return unbanMember;
}

export default useUnbanMember;
