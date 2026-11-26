import { useCallback } from "react";
import useProject from "../../projects/useProject";
import { Rule } from "../../../interfaces/models/Rule";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import { SublayError } from "../../../errors/SublayError";

export interface FetchRuleProps {
  spaceId: string;
  ruleId: string;
}

function useFetchRule(): (props: FetchRuleProps) => Promise<Rule> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchRule = useCallback(
    async ({ spaceId, ruleId }: FetchRuleProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!spaceId) {
        throw new SublayError("Please pass a spaceId");
      }

      if (!ruleId) {
        throw new SublayError("Please pass a ruleId");
      }

      const response = await axios.get(
        `/${projectId}/spaces/${spaceId}/rules/${ruleId}`
      );

      return response.data as Rule;
    },
    [projectId, axios]
  );

  return fetchRule;
}

export default useFetchRule;
