import { useCallback } from "react";
import useProject from "../../projects/useProject";
import useAxiosPrivate from "../../../config/useAxiosPrivate";

export interface DeleteRuleProps {
  spaceId: string;
  ruleId: string;
}

function useDeleteRule(): (props: DeleteRuleProps) => Promise<void> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const deleteRule = useCallback(
    async ({ spaceId, ruleId }: DeleteRuleProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId) {
        throw new Error("Please pass a spaceId");
      }

      if (!ruleId) {
        throw new Error("Please pass a ruleId");
      }

      await axios.delete(
        `/${projectId}/spaces/${spaceId}/rules/${ruleId}`
      );
    },
    [projectId, axios]
  );

  return deleteRule;
}

export default useDeleteRule;
