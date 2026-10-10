import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Comment,
  CommentInclude,
  CommentThreadIncludeParam,
  GifData,
} from "../../interfaces/models/Comment";

import {
  CommentReplySortByOptions,
  CommentsSortByOptions,
} from "../../interfaces/CommentsSortByOptions";
import { User } from "../../interfaces/models/User";
import useCreateComment from "./useCreateComment";
import { Mention } from "../../interfaces/models/Mention";
import { handleError } from "../../utils/handleError";
import { SUSPENDED_ERROR_CODE, isSuspendedError } from "../../errors/SuspendedError";
import useDeleteComment from "./useDeleteComment";
import useUpdateComment from "./useUpdateComment";
import useAddReaction from "../reactions/useAddReaction";
import { ReactionType } from "../../interfaces/models/Reaction";
import {
  CommentSectionInternals,
  CommentStoreSeed,
  useEntityCommentsInternal,
} from "./useEntityComments";
import {
  insertComments,
  insertHighlightedComment,
  markCommentDeleted,
  markCommentRemoved,
  patchComment,
  removeComment,
} from "../../helpers/commentStore";
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
  /** Top-level comments per page. Defaults to 15. */
  limit?: number;
  /** Runtime-changeable via `setSortBy`. Defaults to `"top"`. */
  defaultSortBy?: CommentsSortByOptions;
  /** Initial sort direction; applies to every sort. Defaults to `"desc"`. */
  defaultSortDir?: "asc" | "desc";
  /** Initial reaction `top` ranks by (server default `"upvote"`). Runtime-changeable. */
  defaultSortByReaction?: ReactionType;
  /** Sort for replies; each defaults to the current section sort. Not runtime-changeable. */
  replySortBy?: CommentReplySortByOptions;
  replySortDir?: "asc" | "desc";
  replySortByReaction?: ReactionType;
  /**
   * Levels of replies to bring with every top-level page (0–5). Defaults to
   * 0: replies load on demand through `useReplies`.
   */
  replyDepth?: number;
  /** Replies per comment in the nested levels. Defaults to 3. */
  replyLimit?: number;
  /** Applied at every level. Defaults to `"user"`. */
  include?: CommentThreadIncludeParam;
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

/**
 * Why creating a comment failed. `code` and `message` come from the server's
 * error response and `status` is its HTTP status; all three are `undefined`
 * when no response arrived (a network error). `parentId` is the comment that
 * was being replied to, or `null` for a top-level comment.
 */
export interface CommentCreateError {
  code?: string;
  message?: string;
  status?: number;
  parentId: string | null;
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
  comments: Comment[];
  newComments: Comment[];
  highlightedComment: {
    comment: Comment;
    parentComment: Comment | null;
  } | null;
  /**
   * `true` while the comment named by `highlightedCommentId` is being
   * fetched — until it's found, not found, or the fetch fails. `false` when
   * there's no `highlightedCommentId`.
   */
  highlightedCommentLoading: boolean;
  loading: boolean;
  /**
   * The last failure loading the comment list. Cleared when the next load
   * starts. `loadMore()` retries a failed load, including a failed first page.
   */
  error: Error | null;
  hasMore: boolean;
  submittingComment: boolean;
  /**
   * The last failure creating a comment through `createComment`. Set when a
   * create fails; cleared when the next create starts. The same details are
   * passed to `callbacks.commentCreateFailedCallback`.
   */
  createError: CommentCreateError | null;
  /**
   * Fetch the next page of top-level comments, or retry the one that failed.
   * Does nothing while loading or when there's nothing more; never throws
   * (failures land in `error`).
   */
  loadMore: () => Promise<void>;
  sortBy: CommentsSortByOptions | null;
  setSortBy: (newSortBy: CommentsSortByOptions) => void;
  /** Applies to every sort. */
  sortDir: "asc" | "desc";
  setSortDir: (newSortDir: "asc" | "desc") => void;
  /** The reaction `top` ranks by; only sent with `sortBy: "top"`. */
  sortByReaction: ReactionType | undefined;
  setSortByReaction: (newReaction: ReactionType | undefined) => void;
  /** A loaded comment by id (without nested `replies`). */
  getComment: (commentId: string) => Comment | undefined;
  pushMention: User | null;
  selectedComment: Comment | null;
  setSelectedComment: (newSelectedComment: Comment | null) => void;
  repliedToComment: Partial<Comment> | null;
  setRepliedToComment: (newRepliedToComment: Comment | null) => void;
  showReplyBanner: boolean;
  setShowReplyBanner: ({ newState }: { newState: boolean }) => void;
  handleDeepReply: (comment: Comment) => void;
  handleShallowReply: (comment: Comment) => void;

  createComment: (props: CommentSectionCreateCommentProps) => Promise<Comment | undefined>;
  updateComment: (props: CommentSectionUpdateCommentProps) => Promise<void>;
  deleteComment: (props: CommentSectionDeleteCommentProps) => Promise<void>;
}

export function useCommentSectionDataInternal(
  props: UseCommentSectionDataProps,
): { values: UseCommentSectionDataValues; internals: CommentSectionInternals } {
  const {
    entity: entityProp,
    entityId,
    foreignId,
    shortId,
    createIfNotFound,

    defaultSortBy = "top" as CommentsSortByOptions,
    defaultSortDir = "desc",
    defaultSortByReaction,
    replySortBy,
    replySortDir,
    replySortByReaction,
    replyDepth,
    replyLimit,
    include = "user",
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

  const { values: entityComments, internals } = useEntityCommentsInternal({
    entityId: entity?.id,
    defaultSortBy,
    defaultSortDir,
    defaultSortByReaction,
    replySortBy,
    replySortDir,
    replySortByReaction,
    replyDepth,
    replyLimit,
    limit,
    include,
  });
  const {
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
  } = entityComments;
  const { store, setStore, seedRef } = internals;

  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const updateComment = useUpdateComment();
  const addReaction = useAddReaction();
  const fetchComment = useFetchComment();
  const fetchEntity = useFetchEntity();
  const fetchEntityByForeignId = useFetchEntityByForeignId();
  const fetchEntityByShortId = useFetchEntityByShortId();

  const fetchingCommentIdRef = useRef<string | null>(null);

  // A highlight belongs to one highlighted id on one entity. When the id
  // changes, or the section switches to another entity, the epoch moves on:
  // the old highlight stops being shown, stops being seeded into resets, and
  // a late response for it is dropped. Done during render so the section's
  // reset (an effect) already runs without the old seed.
  const currentEntityId = entity?.id ?? null;
  const highlightTrackRef = useRef({
    epoch: 0,
    highlightId: highlightedCommentId ?? null,
    entityId: currentEntityId,
  });
  {
    const track = highlightTrackRef.current;
    const highlightChanged = track.highlightId !== (highlightedCommentId ?? null);
    const entitySwitched =
      track.entityId !== null && track.entityId !== currentEntityId;
    if (highlightChanged || entitySwitched) {
      highlightTrackRef.current = {
        epoch: track.epoch + 1,
        highlightId: highlightedCommentId ?? null,
        entityId: currentEntityId,
      };
      seedRef.current = null;
      fetchingCommentIdRef.current = null;
    } else if (track.entityId === null && currentEntityId !== null) {
      // The entity resolving for the first time isn't a switch.
      track.entityId = currentEntityId;
    }
  }
  const highlightEpoch = highlightTrackRef.current.epoch;
  // The entity the section shows now, for checking a highlight response.
  const sectionEntityIdRef = useRef<string | null>(null);
  sectionEntityIdRef.current = entity?.id ?? entityId ?? null;

  // What the highlight fetch returned; the rendered copy comes from the store
  // (below), so edits, deletes and refreshes reach it.
  const [highlightSnapshot, setHighlightSnapshot] = useState<{
    epoch: number;
    comment: Comment;
    parentComment: Comment | null;
  } | null>(null);
  // The epoch whose highlight fetch has finished (found, not found or
  // failed). Derived against the current epoch, so a new highlighted id or an
  // entity switch is "loading" again until its own fetch settles.
  const [highlightSettledEpoch, setHighlightSettledEpoch] = useState<
    number | null
  >(null);
  const highlightedCommentLoading =
    !!highlightedCommentId && highlightSettledEpoch !== highlightEpoch;
  // A highlight fetched before the entity was known (the section was given a
  // `foreignId` / `shortId`) couldn't be checked against it then. Once the
  // entity is known, a highlight on another entity is dropped: not shown and
  // not seeded into resets. The seed is cleared here, during render, so the
  // reset the section runs for the newly known entity (an effect) starts from
  // an empty store, without this highlight's nodes.
  const highlightOnOtherEntity =
    !!highlightSnapshot &&
    highlightSnapshot.epoch === highlightEpoch &&
    !!currentEntityId &&
    !!highlightSnapshot.comment.entityId &&
    highlightSnapshot.comment.entityId !== currentEntityId;
  if (highlightOnOtherEntity) seedRef.current = null;
  const highlightedComment = useMemo(() => {
    if (
      !highlightSnapshot ||
      highlightSnapshot.epoch !== highlightEpoch ||
      highlightOnOtherEntity
    ) {
      return null;
    }
    const { comment, parentComment } = highlightSnapshot;
    return {
      comment: store.nodes[comment.id]?.comment ?? comment,
      parentComment: parentComment
        ? (store.nodes[parentComment.id]?.comment ?? parentComment)
        : null,
    };
  }, [highlightSnapshot, highlightEpoch, highlightOnOtherEntity, store]);
  // The highlighted comment is fetched with the section's include plus
  // `parent` (needed to seed the store). Keyed by string so an inline array
  // prop doesn't change identity every render.
  const highlightIncludeKey = Array.from(
    new Set([...(Array.isArray(include) ? include : [include]), "parent"]),
  ).join(",");
  const fetchedStatus = useRef<Record<string, boolean>>({}); // Track status by unique key

  const submittingComment = useRef(false);
  const [submittingCommentState, setSubmittingCommentState] = useState(false); // required to trigger rerenders
  const [createError, setCreateError] = useState<CommentCreateError | null>(null);

  const [pushMention, setPushMention] = useState<null | User>(null);
  // const previousPushMention = useRef<null | User>(null);

  const [repliedToComment, setRepliedToComment] =
    useState<Partial<Comment> | null>(null);
  const [showReplyBanner, setShowReplyBanner] = useState(false);
  const setShowReplyBannerHandler = useCallback(({ newState }: { newState: boolean }) => {
    setShowReplyBanner(newState);
  }, []);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  // The latest reply target, for a create that settles after it changed.
  const replyTargetRef = useRef(repliedToComment);
  replyTargetRef.current = repliedToComment;

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
      setCreateError(null);

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
        userId: user.id,
        parentId: parentId ?? repliedToComment?.id ?? null,
        referencedCommentId: null,
        entityId: entity.id,
        spaceId: entity.spaceId ?? null,
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
        attachments: [],
        metadata: {},
        moderationStatus: null,
        moderatedAt: null,
        moderatedById: null,
        moderatedByType: null,
        moderationReason: null,
      };

      // The reply target is cleared while the request is in flight, and put
      // back if it fails (below), so sending again is still a reply to the
      // same comment.
      const replyTargetBefore = repliedToComment;
      const replyBannerBefore = showReplyBanner;
      const pushMentionBefore = pushMention;
      setRepliedToComment(null);
      replyTargetRef.current = null;
      setShowReplyBanner(false);
      setPushMention(null);

      const newParentId = tempNewComment.parentId;
      // D24: a new comment is counted at once (its parent's repliesCount and
      // the entity's commentsCount). The parent or the entity can be
      // re-delivered while the create is in flight, replacing the bumped
      // count with the server's. So on settle: if the count is still the one
      // we set, a success keeps it and a failure takes it back; if it was
      // re-delivered (from before this comment existed), a success adds the
      // comment and a failure leaves it alone.
      let bumpedRepliesCount: number | null = null;
      let bumpedCommentsCount: number | null = null;
      const settleCount = (
        current: number,
        bumped: number | null,
        succeeded: boolean,
      ): number => {
        const stillBumped = current === bumped;
        if (succeeded) return stillBumped ? current : current + 1;
        return stillBumped ? Math.max(0, current - 1) : current;
      };
      const bumpCounts = () => {
        if (newParentId) {
          setStore((prev) =>
            patchComment(prev, newParentId, (parent) => {
              bumpedRepliesCount = (parent.repliesCount ?? 0) + 1;
              return { ...parent, repliesCount: bumpedRepliesCount };
            }),
          );
        }
        setContextEntity?.((prevEntity) => {
          if (!prevEntity) return prevEntity;
          bumpedCommentsCount = (prevEntity.commentsCount ?? 0) + 1;
          return { ...prevEntity, commentsCount: bumpedCommentsCount };
        });
      };
      const settleCounts = (succeeded: boolean) => {
        if (newParentId) {
          setStore((prev) => {
            const parent = prev.nodes[newParentId]?.comment;
            if (!parent) return prev;
            const current = parent.repliesCount ?? 0;
            const next = settleCount(current, bumpedRepliesCount, succeeded);
            if (next === current) return prev;
            return patchComment(prev, newParentId, (c) => ({ ...c, repliesCount: next }));
          });
        }
        setContextEntity?.((prevEntity) => {
          if (!prevEntity) return prevEntity;
          const current = prevEntity.commentsCount ?? 0;
          const next = settleCount(current, bumpedCommentsCount, succeeded);
          if (next === current) return prevEntity;
          return { ...prevEntity, commentsCount: next };
        });
      };

      try {
        setStore((prev) => insertComments(prev, [tempNewComment], { newlyAdded: true }));
        bumpCounts();
        const newCommentData = await createComment({
          entityId: entity.id,
          parentCommentId: parentId ?? repliedToComment?.id ?? null,
          content,
          gif,
          mentions: filteredMentions,
        });

        settleCounts(true);
        if (newCommentData) {
          setStore((prev) => removeComment(prev, TEMP_ID));

          if (autoReaction) {
            // Add comment with optimistic reaction data while the API call is in flight
            setStore((prev) =>
              insertComments(
                prev,
                [
                  {
                    ...newCommentData,
                    userReaction: autoReaction,
                    reactionCounts: {
                      ...newCommentData.reactionCounts,
                      [autoReaction]:
                        (newCommentData.reactionCounts?.[autoReaction] ?? 0) + 1,
                    },
                  },
                ],
                { newlyAdded: true },
              ),
            );
            // Fire-and-forget: update the store with server truth when the reaction API resolves
            addReaction({
              targetType: "comment",
              targetId: newCommentData.id,
              reactionType: autoReaction,
            })
              .then((updatedComment) => {
                // The reaction response isn't a full comment (no `user`), so
                // only the reaction fields are taken from it.
                const reacted = updatedComment as Partial<Comment> | undefined;
                if (!reacted) return;
                setStore((prev) =>
                  patchComment(prev, newCommentData.id, (current) => ({
                    ...current,
                    userReaction:
                      reacted.userReaction !== undefined
                        ? reacted.userReaction
                        : current.userReaction,
                    reactionCounts: reacted.reactionCounts ?? current.reactionCounts,
                  })),
                );
              })
              .catch(() => {});
          } else {
            setStore((prev) =>
              insertComments(prev, [newCommentData], { newlyAdded: true }),
            );
          }
        }
        return newCommentData;
      } catch (err: unknown) {
        // TODO: currently we remove the temp comment from the store but don't offer the user any option to retry. It's as if they've never sent anything and all they typed is gone. We need to add a flag for comment in the store that says it failed so we can give the user a try again button
        setStore((prev) => removeComment(prev, TEMP_ID));
        settleCounts(false);

        const response = (err as { response?: { status?: unknown; data?: unknown } } | null)
          ?.response;
        const body = (response?.data ?? null) as { code?: unknown; error?: unknown } | null;
        // A write refused because the user is suspended arrives as a
        // `SuspendedError` (the response interceptor converts the 403), which
        // has no `response`: its details are on the error itself.
        const failure: CommentCreateError = isSuspendedError(err)
          ? {
              code: SUSPENDED_ERROR_CODE,
              message: err.message,
              status: 403,
              parentId: newParentId,
            }
          : {
              code: typeof body?.code === "string" ? body.code : undefined,
              message: typeof body?.error === "string" ? body.error : undefined,
              status: typeof response?.status === "number" ? response.status : undefined,
              parentId: newParentId,
            };
        // The server refuses a direct reply to a deleted or removed comment.
        // The section's copy of that comment was loaded before it was deleted
        // or removed, so it becomes the placeholder the server would return
        // now.
        if (newParentId && failure.code === "comment/parent-deleted") {
          setStore((prev) =>
            prev.nodes[newParentId]?.comment.userDeletedAt
              ? prev
              : markCommentDeleted(prev, newParentId),
          );
        } else if (newParentId && failure.code === "comment/parent-removed") {
          setStore((prev) => markCommentRemoved(prev, newParentId, user.id));
        }
        setCreateError(failure);

        // Put the reply target (and its banner) back, unless another one was
        // picked in the meantime. `pushMention` stays cleared: the mention is
        // already in the text the form still holds, and pushing it again
        // would write it a second time.
        // The banner named the pushed mention when there was one, else the
        // target's author; the restored target carries that same user, and
        // the banner only comes back when there is someone to name.
        if (replyTargetBefore && replyTargetRef.current === null) {
          const bannerUser = pushMentionBefore ?? replyTargetBefore.user ?? null;
          setRepliedToComment(
            bannerUser ? { ...replyTargetBefore, user: bannerUser } : replyTargetBefore,
          );
          setShowReplyBanner(replyBannerBefore && !!bannerUser);
        }
        handleError(err, "Failed to submit a new comment: ");
        try {
          callbacks?.commentCreateFailedCallback?.(failure);
        } catch (callbackErr) {
          handleError(callbackErr, "commentCreateFailedCallback threw: ");
        }
        return undefined;
      } finally {
        submittingComment.current = false;
        setSubmittingCommentState(false);
      }
    },
    [
      user,
      setStore,
      setContextEntity,
      entity,
      createComment,
      addReaction,
      repliedToComment,
      showReplyBanner,
      pushMention,
      callbacks,
    ],
  );

  const handleDeleteComment = useCallback(
    async ({ commentId }: CommentSectionDeleteCommentProps) => {
      if (!isUUID(commentId)) return;
      try {
        // Reddit-style: the comment stays as a placeholder (its replies stay
        // intact). Counts don't change: the placeholder is still counted (D24).
        setStore((prev) => markCommentDeleted(prev, commentId));
        await deleteComment({ commentId });
      } catch (err) {
        handleError(err, "Failed to delete comment");
      }
    },
    [deleteComment, setStore],
  );

  const handleUpdateComment = useCallback(
    async ({ commentId, content }: CommentSectionUpdateCommentProps) => {
      try {
        const updatedComment = await updateComment({ commentId, content });

        if (updatedComment) {
          // The update response is the bare comment row (no `user`, no
          // reactions), so only the edited fields are taken from it.
          setStore((prev) =>
            patchComment(prev, commentId, (current) => ({
              ...current,
              content: updatedComment.content ?? content,
              metadata:
                updatedComment.metadata !== undefined
                  ? updatedComment.metadata
                  : current.metadata,
              updatedAt: updatedComment.updatedAt ?? current.updatedAt,
            })),
          );
        }
      } catch (err) {
        handleError(err, "Failed to update comment");
      }
    },
    [updateComment, setStore],
  );

  useEffect(() => {
    const epoch = highlightEpoch;
    const handleFetchSingleComment = async () => {
      if (fetchingCommentIdRef.current === highlightedCommentId) {
        return; // Skip if already fetching for this comment ID
      }

      fetchingCommentIdRef.current = highlightedCommentId!;

      try {
        const targetComment = await fetchComment({
          commentId: highlightedCommentId!,
          include: highlightIncludeKey.split(",") as CommentInclude[],
        });

        // The highlight (or the entity) changed while this was in flight.
        if (highlightTrackRef.current.epoch !== epoch) return;

        if (!targetComment) {
          console.error("Highlighted comment not found");
          return;
        }

        // A comment on another entity isn't this section's to highlight.
        const sectionEntityId = sectionEntityIdRef.current;
        if (
          sectionEntityId &&
          targetComment.entityId &&
          targetComment.entityId !== sectionEntityId
        ) {
          return;
        }

        const parentComment = targetComment.parentComment ?? null;

        setHighlightSnapshot({ epoch, comment: targetComment, parentComment });

        // Parent first, then the target. Kept across sort resets, carrying
        // the latest stored copies (an edit or delete survives the reset).
        const seed: CommentStoreSeed = (empty, previous) =>
          insertHighlightedComment(
            empty,
            previous.nodes[targetComment.id]?.comment ?? targetComment,
            parentComment
              ? (previous.nodes[parentComment.id]?.comment ?? parentComment)
              : null,
          );
        seedRef.current = seed;
        setStore((prev) =>
          insertHighlightedComment(prev, targetComment, parentComment),
        );
      } catch (err) {
        // A missing highlight (deleted, nonexistent, hidden) isn't a section
        // failure: the section loads normally and `error` is untouched.
        handleError(err, "Fetching single comment failed");
      } finally {
        // Only the current highlight's fetch settles the loading state.
        if (highlightTrackRef.current.epoch === epoch) {
          setHighlightSettledEpoch(epoch);
        }
      }
    };

    if (highlightedCommentId) {
      handleFetchSingleComment();
    }
  }, [highlightedCommentId, highlightEpoch, highlightIncludeKey, fetchComment, setStore, seedRef]);

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

  const values: UseCommentSectionDataValues = {
    entity,
    callbacks,

    comments,
    newComments,
    highlightedComment,
    highlightedCommentLoading,

    loading,
    error,
    hasMore,
    submittingComment: submittingCommentState,
    createError,

    loadMore,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    sortByReaction,
    setSortByReaction,
    getComment,
    pushMention,
    selectedComment,
    setSelectedComment,
    repliedToComment,
    setRepliedToComment,
    showReplyBanner,
    setShowReplyBanner: setShowReplyBannerHandler,

    handleShallowReply,
    handleDeepReply,

    createComment: handleCreateComment,
    updateComment: handleUpdateComment,
    deleteComment: handleDeleteComment,
  };

  return { values, internals };
}

function useCommentSectionData(
  props: UseCommentSectionDataProps,
): UseCommentSectionDataValues {
  return useCommentSectionDataInternal(props).values;
}

export default useCommentSectionData;
