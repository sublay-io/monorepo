import { useViewerKey } from "../list/useViewerKey";
import useProject from "../projects/useProject";
import { Reaction, ReactionType } from "../../interfaces/models/Reaction";
import useFetchCommentReactions from "./useFetchCommentReactions";
import { useListEngine } from "../list/useListEngine";
import { pageNumberPaging } from "../list/paging";

export interface UseFetchCommentReactionsWrapperProps {
  commentId: string;
  limit?: number;
  reactionType?: ReactionType;
  sortDir?: "asc" | "desc";
  autoFetch?: boolean;
}

export interface UseFetchCommentReactionsWrapperValues {
  reactions: Reaction[];
  loading: boolean;
  /** The last load failure. Cleared when the next load starts; `loadMore()` retries it. */
  error: Error | null;
  /** Whether `loadMore()` has anything to fetch: a next page, or a load that failed. */
  hasMore: boolean;
  /**
   * Load the next page, or retry the load that failed. With `autoFetch` off,
   * the first call loads page 1. Does nothing while loading or when there is
   * nothing more. Never rejects.
   */
  loadMore: () => Promise<void>;
  /** Reload from page 1. Never rejects. */
  refetch: () => Promise<void>;
}

function useFetchCommentReactionsWrapper(
  props: UseFetchCommentReactionsWrapperProps
): UseFetchCommentReactionsWrapperValues {
  const {
    commentId,
    limit = 20,
    reactionType,
    sortDir = "desc",
    autoFetch = false,
  } = props;

  const fetchCommentReactions = useFetchCommentReactions();

  // A different project is a different list, and so is a different viewer
  // (results carry the viewer's reactions, follows, blocks).
  const { projectId } = useProject();
  const viewerId = useViewerKey();

  // The one request builder for every page.
  const buildParams = (page: number) => ({
    commentId,
    page,
    limit,
    reactionType,
    sortDir,
  });

  const list = useListEngine<Reaction, number>({
    enabled: !!commentId,
    resetKey: JSON.stringify([projectId, viewerId, buildParams(1)]),
    autoLoad: autoFetch,
    fetchPage: pageNumberPaging((page) => fetchCommentReactions(buildParams(page))),
    errorLabel: "Failed to fetch reactions:",
  });

  return {
    reactions: list.items,
    loading: list.loading,
    error: list.error,
    hasMore: list.hasMore,
    loadMore: list.loadMore,
    refetch: list.refetch,
  };
}

export default useFetchCommentReactionsWrapper;
