/**
 * Whether the server refused the credential itself, as opposed to the request
 * failing to complete.
 *
 * 401/403 are the two the auth surface uses: a refused, expired or revoked
 * refresh token, and a family destroyed by reuse detection. A 404
 * `auth/user-not-found` is one too: the token's user no longer exists, so no
 * retry can bring the credential back. A transport failure
 * carries no `response` at all and must NOT be read as a dead account — badging
 * a healthy account as needing a re-authentication every time someone opens the
 * app on a train is worse than not badging it at all.
 *
 * Shared, because the same distinction is drawn in two places that must not
 * drift apart: the account transition (`accountTransition.ts`) and the launch
 * path (`authThunks.ts`). Both feed the same `needsReauth` marker.
 */
export function isCredentialRejection(error: unknown): boolean {
  const response = (
    error as
      | { response?: { status?: number; data?: { code?: unknown } } }
      | null
      | undefined
  )?.response;
  const status = response?.status;
  if (status === 401 || status === 403) return true;
  return status === 404 && response?.data?.code === "auth/user-not-found";
}
