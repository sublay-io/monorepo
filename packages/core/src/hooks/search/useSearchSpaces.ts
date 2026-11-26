import { useCallback, useState } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { handleError } from "../../utils/handleError";
import { Space } from "../../interfaces/models/Space";
import { SublayError, toSublayError } from "../../errors/SublayError";

export interface SpaceSearchResult {
  similarity: number;
  record: Space;
}

export interface UseSearchSpacesProps {
  query: string;
  limit?: number;
}

export interface UseSearchSpacesReturn {
  results: SpaceSearchResult[];
  loading: boolean;
  error: SublayError | null;
  search: (props: UseSearchSpacesProps) => Promise<void>;
  reset: () => void;
}

export default function useSearchSpaces(): UseSearchSpacesReturn {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const [results, setResults] = useState<SpaceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SublayError | null>(null);

  const search = useCallback(
    async ({ query, limit }: UseSearchSpacesProps) => {
      if (!projectId) return;
      if (!query.trim()) return;

      setLoading(true);
      setError(null);
      try {
        const response = await axios.post<SpaceSearchResult[]>(
          `/${projectId}/search/spaces`,
          { query, limit }
        );
        setResults(response.data);
      } catch (err) {
        handleError(err, "Failed to search spaces");
        setError(toSublayError(err));
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
