import { useCallback } from "react";
import type { SpaceMember } from "../../interfaces/models/SpaceMember";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface AddMemberProps {
  spaceId: string;
  /** The user to add to the space. */
  userId: string;
}

/**
 * Add a user to a space directly: they become an active member at once, with
 * no request or approval step. The signed-in user must be an active moderator
 * or admin of the space. Answers 201 when the user became an active member
 * now, 200 when they already were; the membership row either way.
 */
function useAddMember(): (props: AddMemberProps) => Promise<SpaceMember> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const addMember = useCallback(
    async ({ spaceId, userId }: AddMemberProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!spaceId || !userId) {
        throw new SublayError("spaceId and userId are required");
      }

      const response = await axios.post(
        `/${projectId}/spaces/${spaceId}/members`,
        { userId }
      );

      return response.data as SpaceMember;
    },
    [projectId]
  );

  return addMember;
}

export default useAddMember;
