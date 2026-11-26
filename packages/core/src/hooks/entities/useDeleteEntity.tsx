import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { SublayError } from "../../errors/SublayError";

export interface DeleteEntityProps {
  entityId: string;
}

function useDeleteEntity(): (props: DeleteEntityProps) => Promise<void> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const deleteEntity = useCallback(
    async ({ entityId }: DeleteEntityProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!entityId) {
        throw new SublayError("No entityId provided.");
      }

      await axios.delete(`/${projectId}/entities/${entityId}`);
    },
    [projectId, axios]
  );

  return deleteEntity;
}

export default useDeleteEntity;
