import { useCallback } from "react";
import useProject from "../projects/useProject";
import { LeaveSpaceResponse } from "../../interfaces/models/Space";
import useAxiosPrivate from "../../config/useAxiosPrivate";

export interface LeaveSpaceProps {
  spaceId: string;
}

function useLeaveSpace(): (props: LeaveSpaceProps) => Promise<LeaveSpaceResponse> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const leaveSpace = useCallback(
    async ({ spaceId }: LeaveSpaceProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId) {
        throw new Error("Please pass a spaceId");
      }

      const response = await axios.delete(
        `/${projectId}/spaces/${spaceId}/members/me`
      );

      return response.data as LeaveSpaceResponse;
    },
    [projectId]
  );

  return leaveSpace;
}

export default useLeaveSpace;
