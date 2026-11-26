import { useCallback } from "react";
import useProject from "../projects/useProject";
import { SpaceMember, SpaceMemberRole } from "../../interfaces/models/SpaceMember";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface UpdateMemberRoleProps {
  spaceId: string;
  /** The member's user id. */
  userId: string;
  role: SpaceMemberRole;
}

function useUpdateMemberRole(): (props: UpdateMemberRoleProps) => Promise<SpaceMember> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const updateMemberRole = useCallback(
    async ({ spaceId, userId, role }: UpdateMemberRoleProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!spaceId || !userId || !role) {
        throw new SublayError("spaceId, userId, and role are required");
      }

      const response = await axios.patch(
        `/${projectId}/spaces/${spaceId}/members/${userId}/role`,
        { role }
      );

      return response.data as SpaceMember;
    },
    [projectId]
  );

  return updateMemberRole;
}

export default useUpdateMemberRole;
