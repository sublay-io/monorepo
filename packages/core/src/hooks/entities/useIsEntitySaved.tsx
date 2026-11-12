import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { useUser } from "../user";

export interface UseIsEntitySavedValues {
  checkIfEntityIsSaved: ({ entityId }: { entityId: string }) => Promise<{
    isSaved: boolean;
    collections: Array<{ id: string; name: string }>;
  }>;
}

function useIsEntitySaved(): UseIsEntitySavedValues {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const checkIfEntityIsSaved = useCallback(
    async ({ entityId }: { entityId: string }) => {
      if (!user) {
        throw new Error("No user authenticated.");
      }
      if (!entityId) {
        throw new Error("No entity ID passed.");
      }
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      const response = await axios.get<{
        isSaved: boolean;
        collections: Array<{ id: string; name: string }>;
      }>(`/${projectId}/entities/is-entity-saved`, {
        params: { entityId },
      });

      return response.data;
    },
    [user, axios, projectId]
  );

  return { checkIfEntityIsSaved };
}

export default useIsEntitySaved;
