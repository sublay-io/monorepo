import React, { useState } from "react";
import {
  Comment as CommentType,
  UserMention,
  useReactionToggle,
  getUserName,
  useUser,
  useCommentSection,
} from "@sublay/react-js";

import {
  UserAvatar,
  FromNow,
  resetButton,
  resetDiv,
  resetP,
  EllipsisIcon,
  parseContentWithMentions,
} from "@sublay/ui-core-react-js";

import { cn } from "@/lib/utils";
import Replies from "./replies";
import HeartButton from "./heart-button";
import useUIState from "../../../hooks/use-ui-state";

const Comment = React.memo(
  ({
    comment: commentFromSection,
    extraLeftPadding = 0,
    parentClosed = false,
  }: {
    comment: CommentType;
    extraLeftPadding?: number;
    // True on a reply whose top-level comment is deleted or removed. Reply on
    // a reply goes to that top-level comment, which the server refuses.
    parentClosed?: boolean;
  }) => {
    const { user } = useUser();
    const {
      openCommentMenuModal,
      openCommentMenuModalOwner
    } = useUIState();
    const {
      handleShallowReply,
      handleDeepReply,
      callbacks,
      highlightedComment,
    } = useCommentSection();

    const [hovered, setHovered] = useState(false); // State to track hover

    const comment = commentFromSection;
    const { currentReaction, reactionCounts, toggleReaction } = useReactionToggle({
      targetType: "comment",
      targetId: comment.id,
      initialReaction: comment.userReaction,
      initialReactionCounts: comment.reactionCounts,
    });

    const handleUpvoteComment = () => {
      if (!user) {
        callbacks?.loginRequiredCallback?.();
        return;
      }

      if (!user.username && callbacks?.usernameRequiredCallback) {
        callbacks.usernameRequiredCallback();
        return;
      }

      toggleReaction({ reactionType: "like" });
    };

    const handleRemoveCommentUpvote = () => {
      if (!user) {
        callbacks?.loginRequiredCallback?.();
        return;
      }

      toggleReaction({ reactionType: "like" });
    };

    const userUpvotedComment = currentReaction === "like";

    // The API sends aspectRatio as a string (e.g. "1.5"), so coerce before doing
    // math with it. Falls back to 1 (square) if it's missing or unparsable.
    const gifAspectRatio = Number(comment.gif?.aspectRatio) || 1;

    const [showBlockedComment, setShowBlockedComment] = useState(false);

    // isUnavailable wins over every other marker (the author blocked the
    // viewer): a neutral row with no reply/react — only removing the viewer's
    // own reaction stays possible. A comment by someone the viewer blocked
    // starts collapsed, and can be shown (then replied to / reacted to).
    const isUnavailable = !!comment.isUnavailable;
    const isBlockedCollapsed =
      !isUnavailable && !!comment.isAuthorBlocked && !showBlockedComment;
    const isPlaceholderRow = isUnavailable || isBlockedCollapsed;
    // Reddit-style tombstone, after isUnavailable: a user-deleted comment, or a
    // moderator-removed one served as a placeholder (its author gets it in
    // full, with content, and sees it normally). Replies stay visible.
    const tombstone = isUnavailable
      ? null
      : comment.userDeletedAt
        ? "[deleted]"
        : comment.moderationStatus === "removed" && !comment.userId
          ? "[removed]"
          : null;

    // The viewer's own moderator-removed comment comes back in full (only its
    // author sees it, with a note saying so). The server refuses reactions on
    // it and direct replies to it, so there's no reaction control or Reply;
    // delete stays.
    const isOwnRemoved =
      !tombstone && comment.moderationStatus === "removed" && !!comment.userId;
    const ownRemovedLabel = `Removed by a moderator${
      comment.moderationReason ? `: ${comment.moderationReason}` : ""
    } · only you can see this`;
    const canReply = !isOwnRemoved && !parentClosed;

    return (
      <div
        className={cn(
          "w-full py-2",
          highlightedComment?.comment.id === comment.id &&
          "bg-blue-100 dark:bg-blue-900"
        )}
      >
        {isPlaceholderRow ? (
          <div
            className="pr-4 flex flex-row items-center gap-3"
            style={{ paddingLeft: 16 + extraLeftPadding }}
          >
            <div className="w-8 h-8 rounded-full shrink-0 bg-gray-200 dark:bg-gray-700" />
            <span className="text-[13px] italic text-gray-500 dark:text-gray-400">
              {isUnavailable
                ? "This comment is unavailable"
                : "Comment from a user you blocked"}
            </span>
            {isUnavailable ? (
              currentReaction && (
                <button
                  onClick={() => toggleReaction({ reactionType: currentReaction })}
                  style={resetButton}
                  className="text-xs font-semibold text-gray-500 dark:text-gray-400"
                >
                  Remove your reaction
                </button>
              )
            ) : (
              <button
                onClick={() => setShowBlockedComment(true)}
                style={resetButton}
                className="text-xs font-semibold text-gray-900 dark:text-gray-50"
              >
                Show anyway
              </button>
            )}
          </div>
        ) : (
        <div
          className="pr-4"
          style={{
            paddingLeft: 16 + extraLeftPadding,
          }}
          onMouseEnter={() => setHovered(true)} // Set hovered true
          onMouseLeave={() => setHovered(false)} // Set hovered false
        >
          <div
            className="flex flex-row items-start gap-3"
          >
            {tombstone ? (
              <div className="w-8 h-8 rounded-full shrink-0 bg-gray-200 dark:bg-gray-700" />
            ) : (
            <div
              onClick={() => {
                if (comment.user?.id === user?.id) {
                  callbacks?.currentUserClickCallback?.();
                } else {
                  callbacks?.otherUserClickCallback?.(
                    comment.user?.id ?? "",
                    comment.user?.foreignId
                  );
                }
              }}
            >
              {/* 🎨 CUSTOMIZATION: Avatar size (Default: 32px) */}
              <UserAvatar
                user={comment.user ?? {}}
                borderRadius={32}
                size={32}
              />
            </div>
            )}
            <div
              className="flex-1 flex flex-col gap-2"
            >
              <div
                className="flex flex-row items-baseline gap-1 mt-0.5"
              >
                {tombstone ? (
                  <span className="font-bold text-[13px] text-gray-500 dark:text-gray-400">
                    {tombstone}
                  </span>
                ) : (
                <div
                  onClick={() => {
                    if (comment.user?.id === user?.id) {
                      callbacks?.currentUserClickCallback?.();
                    } else {
                      callbacks?.otherUserClickCallback?.(
                        comment.user?.id ?? "",
                        comment.user?.foreignId
                      );
                    }
                  }}
                  style={resetP}
                  className="font-bold text-[13px] text-gray-900 dark:text-gray-50"
                >
                  {getUserName(comment.user ?? {}, "username")}
                </div>
                )}
                {/* 🎨 CUSTOMIZATION: Timestamp typography */}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  <FromNow
                    time={comment.createdAt}
                    fontSize={12}
                    color="inherit"
                    justNowText="Just now"
                  />
                </span>
              </div>

              {tombstone && (
                <p
                  style={resetP}
                  className="text-sm italic text-gray-500 dark:text-gray-400"
                >
                  {tombstone}
                </p>
              )}
              {!tombstone && comment.content && (
                <p
                  style={resetP}
                  className="text-sm text-gray-900 dark:text-gray-200"
                >
                  {parseContentWithMentions(
                    comment.content,
                    comment.mentions
                      ?.filter((m): m is UserMention => 'username' in m)
                      .map((m) => ({ id: m.id, foreignId: m.foreignId ?? undefined, username: m.username })),
                    user?.id,
                    callbacks?.currentUserClickCallback,
                    callbacks?.otherUserClickCallback
                  )}
                </p>
              )}
              {!tombstone && comment.gif && (
                <img
                  src={comment.gif.gifUrl}
                  alt={comment.gif.altText}
                  className="rounded overflow-hidden object-cover"
                  style={{
                    width: gifAspectRatio > 1 ? 200 : 200 * gifAspectRatio,
                    height: gifAspectRatio < 1 ? 200 : 200 / gifAspectRatio,
                  }}
                />
              )}

              {isOwnRemoved && (
                <p
                  style={resetP}
                  className="text-xs text-gray-500 dark:text-gray-400"
                >
                  {ownRemovedLabel}
                </p>
              )}

              {!tombstone && (
              <div
                style={resetDiv}
                className="flex flex-row items-center gap-2"
              >
                {canReply && (
                <button
                  onClick={() =>
                    comment.parentId
                      ? handleShallowReply!(comment)
                      : handleDeepReply!(comment)
                  }
                  style={resetButton}
                  className="text-xs font-semibold text-gray-500 dark:text-gray-400"
                >
                  Reply
                </button>
                )}
                {hovered && ( // Conditionally render the EllipsisIcon button
                  <button
                    onClick={() =>
                      user && user.id === comment.userId
                        ? openCommentMenuModalOwner?.(comment)
                        : openCommentMenuModal?.(comment)
                    }
                    className="cursor-pointer"
                  >
                    <EllipsisIcon />
                  </button>
                )}
              </div>
              )}
            </div>
            {!tombstone && !isOwnRemoved && (
            <div
              className="flex flex-col items-center"
            >
              {/* 🎨 CUSTOMIZATION: Heart icon styling */}
              <HeartButton
                userUpvoted={userUpvotedComment}
                handleUpvote={handleUpvoteComment}
                handleRemoveUpvote={handleRemoveCommentUpvote}
                iconSize={14}
                emptyColor="rgb(156 163 175)" // gray-400
                fullColor="rgb(220 38 38)" // red-600 (light mode fallback)
                padding={4}
                paddingBottom={4}
              />
              <div
                className="text-xs text-gray-500 dark:text-gray-400 font-normal"
              >
                {reactionCounts.like || 0}
              </div>
            </div>
            )}
          </div>
        </div>
        )}
        {!comment.parentId && <Replies commentId={comment.id} />}
      </div>
    );
  }
);

export default Comment;
