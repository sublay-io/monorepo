import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Comment } from "../../interfaces/models/Comment";
import { handleError } from "../../utils/handleError";
import useCommentSection from "./useCommentSection";
import useFetchManyComments from "./useFetchManyComments";
import { CommentsSortByOptions } from "../../interfaces/CommentsSortByOptions";
import { isUUID } from "../../utils/isUUID";

export interface UseRepliesProps {
  commentId: string;
  sortBy: CommentsSortByOptions;
  /** Sort direction for `sortBy: "createdAt"`. Defaults to `"desc"`. */
  sortDir?: "asc" | "desc";
}

export interface UseRepliesValues {
  replies: (Comment & { new: boolean })[];
  newReplies: (Comment & { new: boolean })[];
  loading: boolean;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
}

function useReplies({ commentId, sortBy, sortDir }: UseRepliesProps): UseRepliesValues {
  const fetchManyComments = useFetchManyComments();
  const { addCommentsToTree, entityCommentsTree } = useCommentSection();

  const [page, setPage] = useState(0);
  const [loadingState, setLoadingState] = useState(false);

  const commentData = entityCommentsTree![commentId];

  // Registered before the early return below: hooks must run on every render,
  // and the node can appear or disappear between renders.
  useEffect(() => {
    const loadReplies = async () => {
      // No node, no fetch: fetched replies would be dropped anyway, since
      // addCommentsToTree skips replies whose parent isn't in the tree.
      if (!commentData) return;

      if (!commentId || !isUUID(commentId)) {
        // console.warn(
        //   "The 'fetch comments' operation was invoked without a valid comment ID and has been aborted."
        // );
        return;
      }

      try {
        setLoadingState(true);

        const response = await fetchManyComments({
          parentId: commentId,
          page,
          sortBy,
          sortDir,
          limit: 5,
          include: "user", // Always include user for replies display
        });

        if (response) {
          const { data: fetchedReplies } = response;
          addCommentsToTree?.(fetchedReplies);
        }
      } catch (err: unknown) {
        handleError(err, "Failed to fetch replies: ");
      } finally {
        setLoadingState(false);
      }
    };

    if (page > 0) {
      loadReplies();
    }
    // Presence is a dependency so a thread that outlives a tree reset (the
    // highlighted thread renders from state, not from the tree) refetches when
    // its node is re-added. Tree-rendered threads unmount on reset instead.
  }, [page, !!commentData]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!commentData) {
    return {
      replies: [],
      newReplies: [],
      loading: loadingState,
      page,
      setPage,
    }; // If the commentID is not found, return an empty array
  }

  const allReplies = commentData.replies;
  const replies = Object.values(allReplies).filter((reply) => !reply.new);

  const newReplies = Object.values(allReplies)
    .filter((reply) => !!reply.new)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return {
    replies,
    newReplies,
    loading: loadingState,
    page,
    setPage,
  };
}

export default useReplies;
