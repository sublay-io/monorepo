import { useCallback } from "react";
import type { SpaceMember } from "../../interfaces/models/SpaceMember";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface BanMemberProps {
  spaceId: string;
  /** The member's user id. */
  userId: string;
  /** Why the member is banned; kept in the space's ban log. */
  reason?: string;
}

function useBanMember(): (props: BanMemberProps) => Promise<SpaceMember> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const banMember = useCallback(
    async ({ spaceId, userId, reason }: BanMemberProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!spaceId || !userId) {
        throw new SublayError("spaceId and userId are required");
      }

      const response = await axios.post(
        `/${projectId}/spaces/${spaceId}/members/${userId}/ban`,
        { reason }
      );

      return response.data as SpaceMember;
    },
    [projectId]
  );

  return banMember;
}

export default useBanMember;
