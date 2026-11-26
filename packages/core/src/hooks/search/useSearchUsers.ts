import { useCallback, useState } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { handleError } from "../../utils/handleError";
import { User } from "../../interfaces/models/User";
import { SublayError, toSublayError } from "../../errors/SublayError";

export interface UserSearchResult {
  similarity: number;
  record: User;
}

export interface UseSearchUsersProps {
  query: string;
  limit?: number;
}

export interface UseSearchUsersReturn {
  results: UserSearchResult[];
  loading: boolean;
  error: SublayError | null;
  search: (props: UseSearchUsersProps) => Promise<void>;
  reset: () => void;
}

export default function useSearchUsers(): UseSearchUsersReturn {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SublayError | null>(null);

  const search = useCallback(
    async ({ query, limit }: UseSearchUsersProps) => {
      if (!projectId) return;
      if (!query.trim()) return;

      setLoading(true);
      setError(null);
      try {
        const response = await axios.post<UserSearchResult[]>(
          `/${projectId}/search/users`,
          { query, limit }
        );
        setResults(response.data);
      } catch (err) {
        handleError(err, "Failed to search users");
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
