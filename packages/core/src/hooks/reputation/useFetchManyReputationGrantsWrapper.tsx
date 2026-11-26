import { useViewerKey } from "../list/useViewerKey";
import useProject from "../projects/useProject";
import { useState } from "react";
import {
  GrantSummary,
  NullableReputationGrantTargetFilter,
  ReputationGrant,
  ReputationGrantInclude,
  ReputationGrantIncludeParam,
} from "../../interfaces/models/ReputationGrant";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import useFetchManyReputationGrants, {
  FetchManyReputationGrantsProps,
} from "./useFetchManyReputationGrants";
import { useListEngine } from "../list/useListEngine";
import { ListPage } from "../list/useListLoader";
import type { SublayError } from "../../errors/SublayError";

type GrantsPage = ListPage<ReputationGrant, number> & {
  summary: GrantSummary | null;
};

interface UseFetchManyReputationGrantsWrapperBaseProps
  extends SpaceReputationContextParams {
  limit?: number;
  /** What this user received. */
  recipientId?: string | null;
  /** What this user sent. */
  senderId?: string | null;
  include?: ReputationGrantIncludeParam;
}

/**
 * The third filter shape — "who rewarded this item" — is the
 * {@link NullableReputationGrantTargetFilter} pair: both fields or neither,
 * with `null` accepted for "neither" because these are React props rather than
 * a wire body. The hook's `canFetch` gate repeats the rule at runtime for
 * plain-JS callers.
 */
export type UseFetchManyReputationGrantsWrapperProps =
  UseFetchManyReputationGrantsWrapperBaseProps &
    NullableReputationGrantTargetFilter;

export interface UseFetchManyReputationGrantsWrapperValues {
  grants: ReputationGrant[];
  /** Only returned by the target filter shape; null otherwise. */
  summary: GrantSummary | null;
  loading: boolean;
  /** The last load failure. Cleared when the next load starts; `loadMore()` retries it. */
  error: SublayError | null;
  /** Whether `loadMore()` has anything to fetch: a next page, or a load that failed. */
  hasMore: boolean;
  /**
   * Load the next page, or retry the load that failed (a failed first page
   * included). Does nothing while loading or when there is nothing more.
   * Never rejects.
   */
  loadMore: () => Promise<void>;
  /** Reload from page 1 (e.g. after issuing a grant). Never rejects. */
  refetch: () => Promise<void>;
}

/**
 * Stateful, paginated list of reputation grants.
 *
 * One `buildParams` feeds every page, so a filter can never be applied to
 * page 1 and silently dropped from page 2.
 *
 * The server requires exactly one filter shape, and requires `targetType` and
 * `targetId` to arrive together. With no filter supplied — or with a half-filled
 * target — the hook stays idle rather than issuing a request it knows will 400.
 */
function useFetchManyReputationGrantsWrapper(
  props: UseFetchManyReputationGrantsWrapperProps = {}
): UseFetchManyReputationGrantsWrapperValues {
  const {
    limit = 10,
    recipientId,
    senderId,
    targetType,
    targetId,
    include,
    spaceReputation,
  } = props;

  // Forwarded to the leaf fetcher, which flattens it via
  // buildSpaceReputationParams before it reaches the serializer. Keyed by its
  // JSON so an inline object literal at the call site doesn't re-arm the
  // effect on every render.
  const reputation = {
    spaceReputation,
  };

  const fetchManyReputationGrants = useFetchManyReputationGrants();

  const [summary, setSummary] = useState<GrantSummary | null>(null);

  // Collapsed to a primitive up front: `include` is almost always written as
  // an inline array literal at the call site, which is a fresh reference on
  // every render and would otherwise restart the list forever.
  const includeParam = Array.isArray(include) ? include.join(",") : include;

  const hasTarget = Boolean(targetType && targetId);
  // A HALF-filled target is its own reason to stay idle, and is not visible in
  // `filterCount`: `{ recipientId, targetType }` counts as one shape, so
  // without this the wrapper would fire and the leaf fetcher would throw the
  // both-or-neither error. The types make this unreachable from TypeScript;
  // plain-JS callers land here.
  const halfTarget = Boolean(targetType) !== Boolean(targetId);
  const filterCount = [
    Boolean(recipientId),
    Boolean(senderId),
    hasTarget,
  ].filter(Boolean).length;
  const canFetch = filterCount === 1 && !halfTarget;

  // A different project is a different list, and so is a different viewer
  // (results carry the viewer's reactions, follows, blocks).
  const { projectId } = useProject();
  const viewerId = useViewerKey();

  // The one request builder for every page: a filter can't be applied to
  // page 1 and dropped from page 2.
  const buildParams = (page: number): FetchManyReputationGrantsProps => {
    const base = {
      page,
      limit,
      recipientId: recipientId ?? undefined,
      senderId: senderId ?? undefined,
      include: includeParam
        ? (includeParam.split(",") as ReputationGrantInclude[])
        : undefined,
      ...reputation,
    };
    // The target pair is attached in one branch rather than as two
    // `?? undefined` fields: spreading them individually would widen both to
    // `T | undefined`, which satisfies neither branch of the leaf's
    // both-or-neither union.
    return targetType && targetId ? { ...base, targetType, targetId } : base;
  };

  const list = useListEngine<ReputationGrant, number>({
    enabled: canFetch,
    // Serialized, so an inline `include` array or `spaceReputation` object
    // doesn't restart the list.
    resetKey: JSON.stringify([projectId, viewerId, buildParams(1)]),
    fetchPage: async (cursor) => {
      const page = cursor ?? 1;
      const response = await fetchManyReputationGrants(buildParams(page));
      const grantsPage: GrantsPage = {
        items: response?.data ?? [],
        hasMore: response?.pagination.hasMore ?? false,
        nextCursor: page + 1,
        summary: response?.summary ?? null,
      };
      return grantsPage;
    },
    // The summary describes the whole filter, so it's taken from page 1.
    onPage: (page, replace) => {
      if (replace) setSummary((page as GrantsPage).summary);
    },
    onClear: () => setSummary(null),
    errorLabel: "Failed to fetch reputation grants:",
  });

  return {
    grants: list.items,
    summary,
    loading: list.loading,
    error: list.error,
    hasMore: list.hasMore,
    loadMore: list.loadMore,
    refetch: list.refetch,
  };
}

export default useFetchManyReputationGrantsWrapper;
