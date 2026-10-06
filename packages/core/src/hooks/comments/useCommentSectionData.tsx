import { useCallback, useEffect, useRef, useState } from "react";
import { Comment, GifData } from "../../interfaces/models/Comment";
import { EntityCommentsTree } from "../../interfaces/EntityCommentsTree";

import { CommentsSortByOptions } from "../../interfaces/CommentsSortByOptions";
import { User } from "../../interfaces/models/User";
import useCreateComment from "./useCreateComment";
import { Mention } from "../../interfaces/models/Mention";
import { handleError } from "../../utils/handleError";
import useDeleteComment from "./useDeleteComment";
import useUpdateComment from "./useUpdateComment";
import useAddReaction from "../reactions/useAddReaction";
import { ReactionType } from "../../interfaces/models/Reaction";
import useEntityComments from "./useEntityComments";
import useFetchComment from "./useFetchComment";
import { useUser } from "../user";
import { Entity } from "../../interfaces/models/Entity";

import {
  useEntity,
  useFetchEntity,
  useFetchEntityByForeignId,
  useFetchEntityByShortId,
} from "../entities";
import { isUUID } from "../../utils/isUUID";
import { useStableObject } from "../useStableObject";

export interface MentionTriggers {
  user?: string;
  space?: string;
}

export interface UseCommentSectionDataProps {
  entity?: Entity | undefined | null;
  entityId?: string | undefined | null;
  foreignId?: string | undefined | null;
  shortId?: string | undefined | null;
  createIfNotFound?: boolean;

  callbacks?: Record<string, (...args: any[]) => void> | undefined;
  limit?: number;
  defaultSortBy?: CommentsSortByOptions;
  /** Initial sort direction for `sortBy: "createdAt"`. Defaults to `"desc"`. */
  defaultSortDir?: "asc" | "desc";
  highlightedCommentId?: string | null;
  mentionTriggers?: MentionTriggers;
}

export interface CommentSectionCreateCommentProps {
  parentId?: string;
  content?: string;
  gif?: GifData;
  mentions?: Mention[];
  autoReaction?: ReactionType;
}

export interface CommentSectionUpdateCommentProps {
  commentId: string;
  content: string;
}

export interface CommentSectionDeleteCommentProps {
  commentId: string;
}

export interface UseCommentSectionDataValues {
  entity: Entity | null | undefined;
  callbacks?: Record<string, (...args: any[]) => void> | undefined;
  entityCommentsTree: EntityCommentsTree;
  comments: Comment[];
  newComments: Comment[];
  highlightedComment: {
    comment: Comment;
    parentComment: Comment | null;
  } | null;
  loading: boolean;
  hasMore: boolean;
  submittingComment: boolean;
  loadMore: () => void;
  sortBy: CommentsSortByOptions | null;
  setSortBy: (newSortBy: CommentsSortByOptions) => void;
  /** Sort direction for `sortBy: "createdAt"`. */
  sortDir: "asc" | "desc";
  setSortDir: (newSortDir: "asc" | "desc") => void;
  pushMention: User | null;
  selectedComment: Comment | null;
  setSelectedComment: (newSelectedComment: Comment | null) => void;
  repliedToComment: Partial<Comment> | null;
  setRepliedToComment: (newRepliedToComment: Comment | null) => void;
  showReplyBanner: boolean;
  setShowReplyBanner: ({ newState }: { newState: boolean }) => void;
  addCommentsToTree: (
    newComments: Comment[] | undefined,
    newlyAdded?: boolean,
  ) => void;
  removeCommentFromTree: ({ commentId }: { commentId: string }) => void;
  handleDeepReply: (comment: Comment) => void;
  handleShallowReply: (comment: Comment) => void;

  createComment: (props: CommentSectionCreateCommentProps) => Promise<Comment | undefined>;
  updateComment: (props: CommentSectionUpdateCommentProps) => Promise<void>;
  deleteComment: (props: CommentSectionDeleteCommentProps) => Promise<void>;
}

function useCommentSectionData(
  props: UseCommentSectionDataProps,
): UseCommentSectionDataValues {
  const {
    entity: entityProp,
    entityId,
    foreignId,
    shortId,
    createIfNotFound,

    defaultSortBy = "top" as CommentsSortByOptions,
    defaultSortDir = "desc",
    limit = 15,
    callbacks: callbacksProp = {},
    highlightedCommentId,
    mentionTriggers: mentionTriggersProp,
  } = props;

  const mentionTriggers = {
    user: mentionTriggersProp?.user ?? "@",
    space: mentionTriggersProp?.space ?? "#",
  };

  // Stabilize callbacks reference to prevent unnecessary re-renders
  const callbacks = useStableObject(callbacksProp);

  const { entity: entityFromContext, setEntity: setContextEntity } =
    useEntity();
  const [entity, setEntity] = useState<Entity | null | undefined>(
    entityProp ?? entityFromContext,
  );

  const { user } = useUser();

  const {
    entityCommentsTree,
    comments,
    newComments,
    loading,
    hasMore,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    loadMore,
    addCommentsToTree,
    removeCommentFromTree,
    markCommentAsDeleted,
  } = useEntityComments({
    entityId: entity?.id,
    defaultSortBy,
    defaultSortDir,
    limit,
    include: "user",
  });

  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const updateComment = useUpdateComment();
  const addReaction = useAddReaction();
  const fetchComment = useFetchComment();
  const fetchEntity = useFetchEntity();
  const fetchEntityByForeignId = useFetchEntityByForeignId();
  const fetchEntityByShortId = useFetchEntityByShortId();

  const [highlightedComment, setHighlightedComment] = useState<{
    comment: Comment;
    parentComment: Comment | null;
  } | null>(null);
  const fetchingCommentIdRef = useRef<string | null>(null);
  const fetchedStatus = useRef<Record<string, boolean>>({}); // Track status by unique key

  const submittingComment = useRef(false);
  const [submittingCommentState, setSubmittingCommentState] = useState(false); // required to trigger rerenders

  const [pushMention, setPushMention] = useState<null | User>(null);
  // const previousPushMention = useRef<null | User>(null);

  const [repliedToComment, setRepliedToComment] =
    useState<Partial<Comment> | null>(null);
  const [showReplyBanner, setShowReplyBanner] = useState(false);
  const setShowReplyBannerHandler = useCallback(({ newState }: { newState: boolean }) => {
    setShowReplyBanner(newState);
  }, []);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);

  // const handleSetPushMention = (user: User | null) => {
  //   if(!user?.username)

  //   setPushMention((prevMention) => {
  //     if (JSON.stringify(prevMention) === JSON.stringify(user)) {
  //       return prevMention;
  //     }
  //     return user;
  //   });
  // };

  // For replies that appear as a child of the comment they are replying to.
  const handleDeepReply = useCallback(
    (comment: Comment) => {
      setRepliedToComment!(comment);
      setShowReplyBanner(true);
    },
    [setRepliedToComment],
  );

  // For replies that appear at the same level as the comment they are replying to. Includes a mention (e.g. @username).
  const handleShallowReply = useCallback(
    (comment: Comment) => {
      setRepliedToComment!({ id: comment.parentId ?? undefined });

      if (comment.user) setPushMention(comment.user);
    },
    [setRepliedToComment],
  );

  const handleCreateComment = useCallback(
    async (props: CommentSectionCreateCommentProps) => {
      const { parentId, content, gif, mentions, autoReaction } = props;

      if (submittingComment.current) return;

      if (!entity) {
        console.error("Invalid entity in useCommentSection");
        return;
      }

      if (!user) {
        callbacks?.loginRequiredCallback?.();
        return;
      }

      if (callbacks?.usernameRequiredCallback && !user.username) {
        callbacks?.usernameRequiredCallback();
        return;
      }

      if (!gif && (!content || content.length <= 1)) {
        callbacks?.commentTooShortCallback();
        return;
      }

      submittingComment.current = true;
      setSubmittingCommentState(true);

      // Filter mentions to include only those whose trigger + identifier appears in the content
      const filteredMentions = content
        ? (mentions || []).filter((mention) => {
            if (mention.type === "space") {
              return content.includes(mentionTriggers.space + mention.slug);
            }
            return content.includes(mentionTriggers.user + mention.username);
          })
        : [];

      const TEMP_ID = Math.random().toString(36).substring(2, 7);

      const tempNewComment: Comment = {
        id: TEMP_ID,
        foreignId: null,
        projectId: "TEMP_PROJECT_ID",
        userId: user.id,
        parentId: parentId ?? repliedToComment?.id ?? null,
        entityId: entity.id,
        content: content ?? null,
        gif: gif ?? null,
        mentions: filteredMentions,
        user: {
          ...user,
          bio: null,
          birthdate: new Date().toISOString(),
          location: null,
          createdAt: new Date().toISOString(),
          avatarFileId: null,
          bannerFileId: null,
        } as User,
        upvotes: [],
        downvotes: [],
        userReaction: autoReaction ?? null,
        reactionCounts: {
          upvote: autoReaction === "upvote" ? 1 : 0,
          downvote: autoReaction === "downvote" ? 1 : 0,
          like: autoReaction === "like" ? 1 : 0,
          love: autoReaction === "love" ? 1 : 0,
          wow: autoReaction === "wow" ? 1 : 0,
          sad: autoReaction === "sad" ? 1 : 0,
          angry: autoReaction === "angry" ? 1 : 0,
          funny: autoReaction === "funny" ? 1 : 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        parentDeletedAt: null,
        userDeletedAt: null,
        repliesCount: 0,
        metadata: {},
        moderationStatus: null,
        moderatedAt: null,
        moderatedById: null,
        moderatedByType: null,
        moderationReason: null,
      };

      setRepliedToComment(null);
      setShowReplyBanner(false);
      setPushMention(null);

      try {
        addCommentsToTree([tempNewComment], true);
        const newCommentData = await createComment({
          entityId: entity.id,
          parentCommentId: parentId ?? repliedToComment?.id ?? null,
          content,
          gif,
          mentions: filteredMentions,
        });

        if (newCommentData) {
          removeCommentFromTree({ commentId: TEMP_ID });

          if (autoReaction) {
            // Add comment with optimistic reaction data while the API call is in flight
            addCommentsToTree(
              [{ ...newCommentData, userReaction: autoReaction, reactionCounts: { ...newCommentData.reactionCounts, [autoReaction]: (newCommentData.reactionCounts?.[autoReaction] ?? 0) + 1 } }],
              true,
            );
            // Fire-and-forget: update the tree with server truth when the reaction API resolves
            addReaction({
              targetType: "comment",
              targetId: newCommentData.id,
              reactionType: autoReaction,
            })
              .then((updatedComment) => {
                addCommentsToTree([updatedComment as Comment], true);
              })
              .catch(() => {});
          } else {
            addCommentsToTree([newCommentData], true);
          }
        }
        setContextEntity?.((prevEntity) => {
          if (!prevEntity) return prevEntity;
          return { ...prevEntity, repliesCount: prevEntity.repliesCount + 1 };
        });
        return newCommentData;
      } catch (err: unknown) {
        // TODO: currently we remove the temp comment from the tree but don't offer the user any option to retry. It's as if they've never sent anything and all they typed is gone. We need to add a flag for comment in the tree that says t failed so we can give he user a try again button
        removeCommentFromTree({ commentId: TEMP_ID });
        handleError(err, "Failed to submit a new comment: ");
        return undefined;
      } finally {
        submittingComment.current = false;
        setSubmittingCommentState(false);
      }
    },
    [
      user,
      addCommentsToTree,
      removeCommentFromTree,
      entity,
      createComment,
      addReaction,
      repliedToComment,
      callbacks,
    ],
  );

  const handleDeleteComment = useCallback(
    async ({ commentId }: CommentSectionDeleteCommentProps) => {
      if (!isUUID(commentId)) return;
      try {
        // Reddit-style: mark as deleted placeholder instead of removing from tree
        markCommentAsDeleted({ commentId });
        await deleteComment({ commentId });
        setContextEntity?.((prevEntity) => {
          if (!prevEntity) return prevEntity;
          return { ...prevEntity, repliesCount: prevEntity.repliesCount - 1 };
        });
      } catch (err) {
        handleError(err, "Failed to delete comment");
      }
    },
    [deleteComment, markCommentAsDeleted],
  );

  const handleUpdateComment = useCallback(
    async ({ commentId, content }: CommentSectionUpdateCommentProps) => {
      try {
        const updatedComment = await updateComment({ commentId, content });

        if (updatedComment) {
          console.log("update comment in tree. Implement!");
        }
      } catch (err) {
        handleError(err, "Failed to update comment");
      }
    },
    [updateComment],
  );

  useEffect(() => {
    const handleFetchSingleComment = async () => {
      if (fetchingCommentIdRef.current === highlightedCommentId) {
        return; // Skip if already fetching for this comment ID
      }

      fetchingCommentIdRef.current = highlightedCommentId!;

      try {
        const targetComment = await fetchComment({
          commentId: highlightedCommentId!,
          include: ["user", "parent"],
        });

        if (!targetComment) {
          console.error("Highlighted comment not found");
          return;
        }

        const parentComment = targetComment.parentComment ?? null;

        // Maintain backward-compatible state structure
        setHighlightedComment({
          comment: targetComment,
          parentComment: parentComment,
        });

        addCommentsToTree?.(
          parentComment ? [targetComment, parentComment] : [targetComment],
        );
      } catch (err) {
        handleError(err, "Fetching single comment failed");
      }
    };

    if (highlightedCommentId) {
      handleFetchSingleComment();
    }
  }, [highlightedCommentId, fetchComment, addCommentsToTree]);

  useEffect(() => {
    const handleFetchEntity = async () => {
      if (!foreignId && !entityId && !shortId) {
        return;
      }

      if (entity && entityId && entity.id === entityId) return;
      if (entity && foreignId && entity.foreignId === foreignId) return;
      if (entity && shortId && entity.shortId === shortId) return;

      const uniqueKey = `${entityId ?? ""}-${foreignId ?? ""}-${shortId ?? ""}`;

      if (fetchedStatus.current[uniqueKey]) return;

      fetchedStatus.current[uniqueKey] = true;

      try {
        let fetchedEntity: Entity | null = null;
        if (entityId) {
          fetchedEntity = await fetchEntity({
            entityId,
          });
        } else if (foreignId) {
          fetchedEntity = await fetchEntityByForeignId({
            foreignId,
            createIfNotFound,
          });
        } else if (shortId) {
          fetchedEntity = await fetchEntityByShortId({
            shortId,
          });
        }

        if (fetchedEntity) {
          setEntity(fetchedEntity);
        }
      } catch (err) {
        handleError(err, "Fetching entity failed");
      }
    };

    handleFetchEntity();
  }, [
    fetchEntity,
    fetchEntityByForeignId,
    fetchEntityByShortId,
    entityId,
    foreignId,
    shortId,
    entity,
    createIfNotFound,
  ]);

  return {
    entity,
    callbacks,

    entityCommentsTree,
    comments,
    newComments,
    highlightedComment,

    loading,
    hasMore,
    submittingComment: submittingCommentState,

    loadMore,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    pushMention,
    selectedComment,
    setSelectedComment,
    repliedToComment,
    setRepliedToComment,
    showReplyBanner,
    setShowReplyBanner: setShowReplyBannerHandler,

    addCommentsToTree,
    removeCommentFromTree,

    handleShallowReply,
    handleDeepReply,

    createComment: handleCreateComment,
    updateComment: handleUpdateComment,
    deleteComment: handleDeleteComment,
  };
}

export default useCommentSectionData;
