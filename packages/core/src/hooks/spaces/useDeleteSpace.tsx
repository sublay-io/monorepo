import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface DeleteSpaceProps {
  spaceId: string;
}

function useDeleteSpace(): (props: DeleteSpaceProps) => Promise<void> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const deleteSpace = useCallback(
    async ({ spaceId }: DeleteSpaceProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!spaceId) {
        throw new SublayError("Please pass a spaceId");
      }

      await axios.delete(`/${projectId}/spaces/${spaceId}`);
    },
    [projectId]
  );

  return deleteSpace;
}

export default useDeleteSpace;
