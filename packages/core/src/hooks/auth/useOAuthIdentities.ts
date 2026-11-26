import { useState, useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { SublayError, toSublayError } from "../../errors/SublayError";

export interface OAuthIdentity {
  id: string;
  provider: string;
  providerAccountId: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface UseOAuthIdentitiesReturn {
  identities: OAuthIdentity[];
  hasPassword: boolean;
  fetchIdentities: () => Promise<void>;
  unlinkIdentity: ({ identityId }: { identityId: string }) => Promise<void>;
  loading: boolean;
  error: SublayError | null;
}

function useOAuthIdentities(): UseOAuthIdentitiesReturn {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();
  const [identities, setIdentities] = useState<OAuthIdentity[]>([]);
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SublayError | null>(null);

  const fetchIdentities = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/${projectId}/oauth/identities`);
      setIdentities(response.data.identities);
      setHasPassword(Boolean(response.data.hasPassword));
    } catch (err) {
      setError(toSublayError(err));
    } finally {
      setLoading(false);
    }
  }, [projectId, axios]);

  const unlinkIdentity = useCallback(
    async ({ identityId }: { identityId: string }) => {
      if (!projectId) return;
      setLoading(true);
      setError(null);
      try {
        await axios.delete(`/${projectId}/oauth/identities/${identityId}`);
        setIdentities((prev) => prev.filter((i) => i.id !== identityId));
      } catch (err) {
        setError(toSublayError(err));
      } finally {
        setLoading(false);
      }
    },
    [projectId, axios]
  );

  return { identities, hasPassword, fetchIdentities, unlinkIdentity, loading, error };
}

export default useOAuthIdentities;
