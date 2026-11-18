import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";

export interface DeleteSpaceProps {
  spaceId: string;
}

function useDeleteSpace(): (props: DeleteSpaceProps) => Promise<void> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const deleteSpace = useCallback(
    async ({ spaceId }: DeleteSpaceProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId) {
        throw new Error("Please pass a spaceId");
      }

      await axios.delete(`/${projectId}/spaces/${spaceId}`);
    },
    [projectId]
  );

  return deleteSpace;
}

export default useDeleteSpace;
