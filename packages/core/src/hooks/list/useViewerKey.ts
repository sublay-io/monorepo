import { useRef } from "react";
import { useSublaySelector } from "../../store/hooks";
import { selectInitialized, selectUser } from "../../store/slices/authSlice";

/**
 * A key for "who is viewing", for a list's reset key: it changes when the
 * signed-in user changes (sign-in, sign-out, an account switch), so the list
 * starts over with the new viewer's results.
 *
 * The auth bootstrap is not a change. A request sent before it settles waits
 * for it (the auth gate) and goes out as whoever is signed in once it has, so
 * the first viewer after the bootstrap keeps the key the list started with:
 * a signed-in cold start makes one first-page request, not two.
 */
export function useViewerKey(): string {
  const initialized = useSublaySelector(selectInitialized);
  const viewerId = useSublaySelector(selectUser)?.id ?? null;
  // The viewer when auth first settled, as seen by this hook.
  const settledViewerRef = useRef<{ id: string | null } | null>(null);
  if (initialized && settledViewerRef.current === null) {
    settledViewerRef.current = { id: viewerId };
  }
  const settled = settledViewerRef.current;
  if (!settled || settled.id === viewerId) return "boot";
  return `viewer:${viewerId ?? "none"}`;
}
