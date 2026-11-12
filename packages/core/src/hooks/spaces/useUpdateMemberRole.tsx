import { useCallback } from "react";
import useProject from "../projects/useProject";
import { SpaceMemberRole } from "../../interfaces/models/SpaceMember";
import { UpdateMemberRoleResponse } from "../../interfaces/models/Space";
import useAxiosPrivate from "../../config/useAxiosPrivate";

export interface UpdateMemberRoleProps {
  spaceId: string;
  /** The member's user id. */
  userId: string;
  role: SpaceMemberRole;
}

function useUpdateMemberRole(): (props: UpdateMemberRoleProps) => Promise<UpdateMemberRoleResponse> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const updateMemberRole = useCallback(
    async ({ spaceId, userId, role }: UpdateMemberRoleProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId || !userId || !role) {
        throw new Error("spaceId, userId, and role are required");
      }

      const response = await axios.patch(
        `/${projectId}/spaces/${spaceId}/members/${userId}/role`,
        { role }
      );

      return response.data as UpdateMemberRoleResponse;
    },
    [projectId]
  );

  return updateMemberRole;
}

export default useUpdateMemberRole;
