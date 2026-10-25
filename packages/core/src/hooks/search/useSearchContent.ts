import { useCallback, useState } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { handleError } from "../../utils/handleError";
import { Entity } from "../../interfaces/models/Entity";
import { Comment } from "../../interfaces/models/Comment";
import { ChatMessage } from "../../interfaces/models/ChatMessage";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../utils/spaceReputationParams";

export interface ContentSearchResult {
  sourceType: "entity" | "comment" | "message";
  similarity: number;
  record: Entity | Comment | ChatMessage;
}

export interface UseSearchContentProps extends SpaceReputationContextParams {
  query: string;
  sourceTypes?: ("entity" | "comment" | "message")[];
  spaceId?: string;
  /**
   * With a `spaceId`, also search every space nested under it (children,
   * grandchildren — the whole subtree, any depth). Ignored without a `spaceId`.
   * Defaults to false (exact-space search).
   */
  includeChildSpaces?: boolean;
  conversationId?: string;
  limit?: number;
}

export interface UseSearchContentReturn {
  results: ContentSearchResult[];
  loading: boolean;
  error: string | null;
  search: (props: UseSearchContentProps) => Promise<void>;
  reset: () => void;
}

export default function useSearchContent(): UseSearchContentReturn {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const [results, setResults] = useState<ContentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async ({ query, sourceTypes, spaceId, includeChildSpaces, conversationId, limit, spaceReputation, spaceReputationId, spaceReputationDescendants }: UseSearchContentProps) => {
      if (!projectId) return;
      if (!query.trim()) return;

      setLoading(true);
      setError(null);
      try {
        // Every field goes in the body on a POST, the space-reputation options too.
        const response = await axios.post<ContentSearchResult[]>(
          `/${projectId}/search/content`,
          {
            query,
            sourceTypes,
            spaceId,
            includeChildSpaces,
            conversationId,
            limit,
            ...buildSpaceReputationParams({
              spaceReputation,
              spaceReputationId,
              spaceReputationDescendants,
            }),
          }
        );
        setResults(response.data);
      } catch (err) {
        setError(handleError(err, "Failed to search content"));
      } finally {
        setLoading(false);
      }
    },
    [projectId, axios]
  );

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, reset };
}
