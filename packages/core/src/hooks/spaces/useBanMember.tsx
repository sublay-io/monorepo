import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import type { BanMemberResponse } from "../../interfaces/models/Space";

export interface BanMemberProps {
  spaceId: string;
  /** The member's user id. */
  userId: string;
  /** Why the member is banned; kept in the space's ban log. */
  reason?: string;
}

function useBanMember(): (props: BanMemberProps) => Promise<BanMemberResponse> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const banMember = useCallback(
    async ({ spaceId, userId, reason }: BanMemberProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId || !userId) {
        throw new Error("spaceId and userId are required");
      }

      const response = await axios.post(
        `/${projectId}/spaces/${spaceId}/members/${userId}/ban`,
        { reason }
      );

      return response.data as BanMemberResponse;
    },
    [projectId]
  );

  return banMember;
}

export default useBanMember;
