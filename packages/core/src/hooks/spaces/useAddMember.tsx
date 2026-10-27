import { useCallback } from "react";
import useProject from "../projects/useProject";
import { AddMemberResponse } from "../../interfaces/models/Space";
import useAxiosPrivate from "../../config/useAxiosPrivate";

export interface AddMemberProps {
  spaceId: string;
  /** The user to add to the space. */
  userId: string;
}

/**
 * Add a user to a space directly: they become an active member at once, with
 * no request or approval step. The signed-in user must be an active moderator
 * or admin of the space.
 */
function useAddMember(): (props: AddMemberProps) => Promise<AddMemberResponse> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const addMember = useCallback(
    async ({ spaceId, userId }: AddMemberProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId || !userId) {
        throw new Error("spaceId and userId are required");
      }

      const response = await axios.post(
        `/${projectId}/spaces/${spaceId}/members`,
        { userId }
      );

      return response.data as AddMemberResponse;
    },
    [projectId]
  );

  return addMember;
}

export default useAddMember;
