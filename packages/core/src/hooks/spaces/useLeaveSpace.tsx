import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface LeaveSpaceProps {
  spaceId: string;
}

function useLeaveSpace(): (props: LeaveSpaceProps) => Promise<void> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const leaveSpace = useCallback(
    async ({ spaceId }: LeaveSpaceProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!spaceId) {
        throw new SublayError("Please pass a spaceId");
      }

      await axios.delete(
        `/${projectId}/spaces/${spaceId}/members/me`
      );
    },
    [projectId]
  );

  return leaveSpace;
}

export default useLeaveSpace;
