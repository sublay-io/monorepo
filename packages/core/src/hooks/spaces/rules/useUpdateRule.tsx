import { useCallback } from "react";
import useProject from "../../projects/useProject";
import { Rule } from "../../../interfaces/models/Rule";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import { SublayError } from "../../../errors/SublayError";

export interface UpdateRuleProps {
  spaceId: string;
  ruleId: string;
  update: Partial<{
    title: string;
    description: string | null;
  }>;
}

function useUpdateRule(): (props: UpdateRuleProps) => Promise<Rule> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const updateRule = useCallback(
    async ({ spaceId, ruleId, update }: UpdateRuleProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!spaceId) {
        throw new SublayError("Please pass a spaceId");
      }

      if (!ruleId) {
        throw new SublayError("Please pass a ruleId");
      }

      const response = await axios.patch(
        `/${projectId}/spaces/${spaceId}/rules/${ruleId}`,
        update
      );

      return response.data as Rule;
    },
    [projectId, axios]
  );

  return updateRule;
}

export default useUpdateRule;
