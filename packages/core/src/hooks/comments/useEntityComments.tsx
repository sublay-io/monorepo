import { oneWaySortFields } from "../../helpers/oneWaySorts";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Comment,
  CommentThreadIncludeParam,
} from "../../interfaces/models/Comment";
import { ReactionType } from "../../interfaces/models/Reaction";
import { CursorPaginatedResponse } from "../../interfaces/PaginatedResponse";
import useFetchManyComments from "./useFetchManyComments";
import {
  CommentReplySortByOptions,
  CommentsSortByOptions,
} from "../../interfaces/CommentsSortByOptions";
import { handleError } from "../../utils/handleError";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import {
  CommentStore,
  emptyCommentStore,
  insertComments,
  selectRootComments,
} from "../../helpers/commentStore";
import {
  COMMENT_REPLY_BUDGET,
  CommentSortTrio,
  DEFAULT_COMMENT_REPLY_LIMIT,
  isDevBuild,
  resolveReplySort,
  sendableReplySortByReaction,
} from "../../helpers/commentThreadConfig";
import { useSublaySelector } from "../../store/hooks";
import { selectUser as selectAuthUser } from "../../store/slices/authSlice";

export interface UseEntityCommentsProps extends SpaceReputationContextParams {
  entityId: string | undefined | null;
  /** Top-level comments per page. Defaults to 10. */
  limit?: number;
  defaultSortBy?: CommentsSortByOptions;
  /** Initial sort direction; applies to every sort. Defaults to `"desc"`. */
  defaultSortDir?: "asc" | "desc";
  /** Initial reaction `top` ranks by (server default `"upvote"`). */
  defaultSortByReaction?: ReactionType;
  /** Sort for nested replies; each defaults to the current section sort. Not runtime-changeable. */
  replySortBy?: CommentReplySortByOptions;
  replySortDir?: "asc" | "desc";
  replySortByReaction?: ReactionType;
  /** Levels of replies to bring with each top-level page (0–5). Defaults to 0 (replies load on demand). */
  replyDepth?: number;
  /** Replies per comment in the nested levels. Defaults to 3. */
  replyLimit?: number;
  /** Applied at every level. Defaults to `"user"`. */
  include?: CommentThreadIncludeParam;
}

export interface UseEntityCommentsValues {
  comments: Comment[];
  /**
   * Top-level comments the viewer posted this session, newest first. Only a
   * comment section adds to it (through its `createComment`); from
   * `useEntityComments` on its own it is always empty.
   */
  newComments: Comment[];
  loading: boolean;
  /**
   * The last failure loading the list. Cleared when the next load starts.
   * `loadMore()` retries a failed load, including a failed first page.
   */
  error: Error | null;
  hasMore: boolean;
  sortBy: CommentsSortByOptions;
  setSortBy: (newSortBy: CommentsSortByOptions) => void;
  /** Applies to every sort. */
  sortDir: "asc" | "desc";
  setSortDir: (newSortDir: "asc" | "desc") => void;
  /** The reaction `top` ranks by; only sent with `sortBy: "top"`. */
  sortByReaction: ReactionType | undefined;
  setSortByReaction: (newReaction: ReactionType | undefined) => void;
  /**
   * Fetch the next page of top-level comments, or retry the one that failed.
   * Does nothing while loading or when there's nothing more; never throws
   * (failures land in `error`).
   */
  loadMore: () => Promise<void>;
  /** A loaded comment by id (without nested `replies`). */
  getComment: (commentId: string) => Comment | undefined;
}

/**
 * What `useReplies` and the section's mutations need from the store. Internal —
 * not exported from the package (D20).
 */
export interface CommentSectionInternals {
  store: CommentStore;
  setStore: Dispatch<SetStateAction<CommentStore>>;
  /** Bumped on every reset; responses from an older generation are dropped. */
  generationRef: { current: number };
  replyDepth: number;
  replyLimit: number;
  replySort: CommentSortTrio;
  include: CommentThreadIncludeParam;
  reputation: SpaceReputationContextParams;
  /**
   * Applied to the empty store on every reset — keeps a deep-linked
   * (highlighted) comment in place across sort changes. Gets the store being
   * reset too, so it can carry over the latest copy of what it seeds.
   */
  seedRef: { current: CommentStoreSeed | null };
}

export type CommentStoreSeed = (
  empty: CommentStore,
  previous: CommentStore,
) => CommentStore;

export const CommentSectionInternalContext =
  createContext<CommentSectionInternals | null>(null);

const toError = (err: unknown): Error =>
  err instanceof Error ? err : new Error(String(err));

/** Dev-mode hint when the section's own request is over the server's row budget. */
function reportBudgetError(err: unknown) {
  const data = (err as { response?: { data?: Record<string, unknown> } })
    ?.response?.data;
  if (data?.code === "comment/reply-budget-exceeded" && isDevBuild()) {
    console.error(
      `[Sublay] This comment section's request could return up to ${String(
        data.requestedRows ?? "?",
      )} comments, over the limit of ${String(
        data.maxRows ?? COMMENT_REPLY_BUDGET,
      )}. Lower \`limit\`, \`replyLimit\` or \`replyDepth\` on the provider.`,
    );
  }
}

export function useEntityCommentsInternal(props: UseEntityCommentsProps): {
  values: UseEntityCommentsValues;
  internals: CommentSectionInternals;
} {
  const {
    entityId,
    limit = 10,
    defaultSortBy = "createdAt",
    defaultSortDir = "desc",
    defaultSortByReaction,
    replySortBy,
    replySortDir,
    replySortByReaction,
    replyDepth = 0,
    replyLimit = DEFAULT_COMMENT_REPLY_LIMIT,
    include = "user",
    spaceReputation,
    spaceReputationId,
    spaceReputationDescendants,
  } = props;

  const reputation = useMemo(
    () => ({ spaceReputation, spaceReputationId, spaceReputationDescendants }),
    [JSON.stringify({ spaceReputation, spaceReputationId, spaceReputationDescendants })], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const includeKey = JSON.stringify(include);

  const fetchManyComments = useFetchManyComments();
  // Each comment carries the signed-in user's own reaction (`userReaction`),
  // so the list is fetched again when the user signs in, signs out or
  // switches accounts.
  const userId = useSublaySelector(selectAuthUser)?.id ?? null;

  const [sortBy, setSortBy] = useState<CommentsSortByOptions>(defaultSortBy);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);
  const [sortByReaction, setSortByReaction] = useState<ReactionType | undefined>(
    defaultSortByReaction,
  );

  const [loadedStore, setStore] = useState<CommentStore>(emptyCommentStore);
  // The entity the store (and `loading` / `error` / `hasMore`) was last reset
  // for. The reset itself runs in an effect, so on the render where the
  // entity changes they still describe the previous entity: until the tag
  // matches, the hook shows what a section that hasn't loaded yet shows.
  const [storeEntityId, setStoreEntityId] = useState<string | null>(
    entityId ?? null,
  );
  const [loadedLoading, setLoading] = useState(true);
  const [loadedError, setError] = useState<Error | null>(null);
  const [loadedHasMore, setHasMore] = useState(true);
  const storeIsCurrent = !!entityId && storeEntityId === entityId;
  const store = useMemo(
    () => (storeIsCurrent ? loadedStore : emptyCommentStore()),
    [storeIsCurrent, loadedStore],
  );
  const loading = storeIsCurrent ? loadedLoading : true;
  const error = storeIsCurrent ? loadedError : null;
  const hasMore = storeIsCurrent ? loadedHasMore : true;

  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const cursorRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const seedRef = useRef<CommentStoreSeed | null>(null);

  // The reaction only matters to `top`; keyed on the effective value so
  // changing it under another sort doesn't reset the section.
  const effectiveSortByReaction = sortBy === "top" ? sortByReaction : undefined;
  const sectionSort: CommentSortTrio = useMemo(
    () => ({ sortBy, sortDir, sortByReaction: effectiveSortByReaction }),
    [sortBy, sortDir, effectiveSortByReaction],
  );

  const replySort = useMemo(
    () =>
      resolveReplySort(sectionSort, {
        replySortBy,
        replySortDir,
        replySortByReaction,
      }),
    [sectionSort, replySortBy, replySortDir, replySortByReaction],
  );

  // Everything one top-level page request needs, kept current for loadMore.
  const requestRef =
    useRef<() => Promise<CursorPaginatedResponse<Comment>>>(undefined);
  requestRef.current = () =>
    fetchManyComments({
      entityId: entityId as string,
      cursor: cursorRef.current,
      limit,
      ...oneWaySortFields(sectionSort.sortBy, sectionSort.sortDir),
      sortByReaction: sectionSort.sortByReaction,
      include,
      ...(replyDepth > 0
        ? {
            replyDepth,
            replyLimit,
            replySortBy,
            replySortDir,
            replySortByReaction: sendableReplySortByReaction(
              replySortBy,
              sectionSort.sortBy,
              replySortByReaction,
            ),
          }
        : {}),
      ...reputation,
    });

  const runFetch = useCallback(async (reset: boolean) => {
    const generation = reset ? ++generationRef.current : generationRef.current;
    loadingRef.current = true;
    setLoading(true);
    // A new attempt (reset or retry) starts clean.
    setError(null);
    if (reset) {
      cursorRef.current = null;
      hasMoreRef.current = true;
      setHasMore(true);
      const empty = emptyCommentStore();
      const seed = seedRef.current;
      setStore((previous) => (seed ? seed(empty, previous) : empty));
    }
    try {
      const response = await requestRef.current!();
      if (generation !== generationRef.current) return;
      const { data, pagination } = response;
      setStore((prev) => insertComments(prev, data));
      cursorRef.current = pagination.nextCursor;
      hasMoreRef.current = pagination.hasMore;
      setHasMore(pagination.hasMore);
      setError(null);
    } catch (err) {
      if (generation !== generationRef.current) return;
      setError(toError(err));
      reportBudgetError(err);
      handleError(err, "Failed to load comments:");
    } finally {
      if (generation === generationRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!entityId) {
      // No entity to list (yet, or any more): a response still in flight for
      // the previous one is dropped.
      generationRef.current++;
      loadingRef.current = false;
      return;
    }
    setStoreEntityId(entityId);
    runFetch(true);
  }, [
    entityId,
    limit,
    sectionSort,
    replyDepth,
    replyLimit,
    replySortBy,
    replySortDir,
    replySortByReaction,
    includeKey,
    reputation,
    userId,
    runFetch,
  ]);

  const loadMore = useCallback(async () => {
    if (!entityId || loadingRef.current || !hasMoreRef.current) return;
    await runFetch(false);
  }, [entityId, runFetch]);

  const { comments, newComments } = useMemo(
    () => selectRootComments(store),
    [store],
  );

  const storeRef = useRef(store);
  storeRef.current = store;
  const getComment = useCallback(
    (commentId: string) => storeRef.current.nodes[commentId]?.comment,
    // Re-created with the store so consumers re-render on changes.
    [store], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const internals: CommentSectionInternals = useMemo(
    () => ({
      store,
      setStore,
      generationRef,
      replyDepth,
      replyLimit,
      replySort,
      include,
      reputation,
      seedRef,
    }),
    [store, replyDepth, replyLimit, replySort, includeKey, reputation], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return {
    values: {
      comments,
      newComments,
      loading,
      error,
      hasMore,
      sortBy,
      setSortBy,
      sortDir,
      setSortDir,
      sortByReaction,
      setSortByReaction,
      loadMore,
      getComment,
    },
    internals,
  };
}

function useEntityComments(
  props: UseEntityCommentsProps,
): UseEntityCommentsValues {
  return useEntityCommentsInternal(props).values;
}

export default useEntityComments;
