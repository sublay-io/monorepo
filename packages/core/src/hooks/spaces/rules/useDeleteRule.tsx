import { useCallback } from "react";
import useProject from "../../projects/useProject";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import { SublayError } from "../../../errors/SublayError";

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
        throw new SublayError("No projectId available.");
      }

      if (!spaceId) {
        throw new SublayError("Please pass a spaceId");
      }

      if (!ruleId) {
        throw new SublayError("Please pass a ruleId");
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
