import { useCallback } from "react";
import useProject from "../../projects/useProject";
import { Rule } from "../../../interfaces/models/Rule";
import useAxiosPrivate from "../../../config/useAxiosPrivate";

export interface FetchManyRulesProps {
  spaceId: string;
}

function useFetchManyRules(): (props: FetchManyRulesProps) => Promise<Rule[]> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchManyRules = useCallback(
    async ({ spaceId }: FetchManyRulesProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId) {
        throw new Error("Please pass a spaceId");
      }

      const response = await axios.get<{ data: Rule[]; count: number }>(
        `/${projectId}/spaces/${spaceId}/rules`
      );

      return response.data.data;
    },
    [projectId, axios]
  );

  return fetchManyRules;
}

export default useFetchManyRules;
