import { useCallback } from "react";
import type { SpaceMember } from "../../interfaces/models/SpaceMember";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface JoinSpaceProps {
  spaceId: string;
}

/**
 * Join a space. Answers 201 with the new membership — `active`, or `pending`
 * when the space requires join approval — and 200 with the existing one when
 * the user is already a member or already asked to join. A banned user gets
 * 403 `space/banned`.
 */
function useJoinSpace(): (props: JoinSpaceProps) => Promise<SpaceMember> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const joinSpace = useCallback(
    async ({ spaceId }: JoinSpaceProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!spaceId) {
        throw new SublayError("Please pass a spaceId");
      }

      const response = await axios.post(`/${projectId}/spaces/${spaceId}/join`);

      return response.data as SpaceMember;
    },
    [projectId]
  );

  return joinSpace;
}

export default useJoinSpace;
