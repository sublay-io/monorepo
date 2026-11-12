import { useCallback } from "react";
import useProject from "../../projects/useProject";
import { Rule } from "../../../interfaces/models/Rule";
import useAxiosPrivate from "../../../config/useAxiosPrivate";

export interface ReorderRulesProps {
  spaceId: string;
  ruleIds: string[];
}

function useReorderRules(): (props: ReorderRulesProps) => Promise<Rule[]> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const reorderRules = useCallback(
    async ({ spaceId, ruleIds }: ReorderRulesProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId) {
        throw new Error("Please pass a spaceId");
      }

      if (!ruleIds || ruleIds.length === 0) {
        throw new Error("Please pass at least one ruleId");
      }

      const response = await axios.post(
        `/${projectId}/spaces/${spaceId}/rules/reorder`,
        { ruleIds }
      );

      return response.data as Rule[];
    },
    [projectId, axios]
  );

  return reorderRules;
}

export default useReorderRules;
