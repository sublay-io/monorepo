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

import Replies from "./replies";
import HeartButton from "./heart-button";
import useUIState from "../../../hooks/use-ui-state";

const Comment = React.memo(
  ({
    comment,
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
    const { theme } = useUIState();

    const [hovered, setHovered] = useState(false); // State to track hover

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
        style={{
          width: "100%",
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor:
            highlightedComment?.comment.id === comment.id
              ? (theme === 'dark' ? "#1E40AF" : "#dbeafe")
              : "transparent",
        }}
      >
        {isPlaceholderRow ? (
          <div
            style={{
              paddingRight: 16,
              paddingLeft: 16 + extraLeftPadding,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 32,
                flexShrink: 0,
                backgroundColor: theme === 'dark' ? '#374151' : '#E5E7EB',
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontStyle: "italic",
                color: theme === 'dark' ? '#9CA3AF' : '#737373',
              }}
            >
              {isUnavailable
                ? "This comment is unavailable"
                : "Comment from a user you blocked"}
            </span>
            {isUnavailable ? (
              currentReaction && (
                <button
                  onClick={() => toggleReaction({ reactionType: currentReaction })}
                  style={{
                    ...resetButton,
                    fontSize: 12,
                    fontWeight: 600,
                    color: theme === 'dark' ? '#9CA3AF' : '#737373',
                  }}
                >
                  Remove your reaction
                </button>
              )
            ) : (
              <button
                onClick={() => setShowBlockedComment(true)}
                style={{
                  ...resetButton,
                  fontSize: 12,
                  fontWeight: 600,
                  color: theme === 'dark' ? '#F9FAFB' : '#000',
                }}
              >
                Show anyway
              </button>
            )}
          </div>
        ) : (
        <div
          style={{
            paddingRight: 16,
            paddingLeft: 16 + extraLeftPadding,
          }}
          onMouseEnter={() => setHovered(true)} // Set hovered true
          onMouseLeave={() => setHovered(false)} // Set hovered false
        >
          <div
            style={{
              // 🎨 CUSTOMIZATION: Comment spacing (Default: 12px horizontal, 8px vertical)
              gap: 12,
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
            }}
          >
            {tombstone ? (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 32,
                  flexShrink: 0,
                  backgroundColor: theme === 'dark' ? '#374151' : '#E5E7EB',
                }}
              />
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
              style={{
                gap: 8,
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "baseline",
                  gap: 4,
                  marginTop: 2,
                }}
              >
                {tombstone ? (
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: theme === 'dark' ? '#9CA3AF' : '#737373',
                    }}
                  >
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
                  style={{
                    ...resetP,
                    // 🎨 CUSTOMIZATION: Author name typography
                    fontWeight: 700,
                    fontSize: 13,
                    color: theme === 'dark' ? '#F9FAFB' : '#000',
                  }}
                >
                  {getUserName(comment.user ?? {}, "username")}
                </div>
                )}
                {/* 🎨 CUSTOMIZATION: Timestamp typography */}
                <FromNow
                  time={comment.createdAt}
                  fontSize={12}
                  color={theme === 'dark' ? '#9CA3AF' : '#737373'}
                  justNowText="Just now"
                />
              </div>

              {tombstone && (
                <p
                  style={{
                    ...resetP,
                    fontSize: 14,
                    fontStyle: "italic",
                    color: theme === 'dark' ? '#9CA3AF' : '#737373',
                  }}
                >
                  {tombstone}
                </p>
              )}
              {!tombstone && comment.content && (
                <p
                  style={{
                    ...resetP,
                    // 🎨 CUSTOMIZATION: Comment body typography
                    fontSize: 14,
                    color: theme === 'dark' ? '#E5E7EB' : '#000',
                  }}
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
                  style={{
                    width: gifAspectRatio > 1 ? 200 : 200 * gifAspectRatio,
                    height: gifAspectRatio < 1 ? 200 : 200 / gifAspectRatio,

                    borderRadius: "0.25rem", // Applies rounded corners to the image itself
                    overflow: "hidden",
                    objectFit: "cover",
                  }}
                />
              )}

              {isOwnRemoved && (
                <p
                  style={{
                    ...resetP,
                    fontSize: 12,
                    color: theme === 'dark' ? '#9CA3AF' : '#737373',
                  }}
                >
                  {ownRemovedLabel}
                </p>
              )}

              {!tombstone && (
              <div
                style={{
                  ...resetDiv,
                  // 🎨 CUSTOMIZATION: Action button spacing and typography
                  gap: 8,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {canReply && (
                <button
                  onClick={() =>
                    comment.parentId
                      ? handleShallowReply!(comment)
                      : handleDeepReply!(comment)
                  }
                  style={{
                    ...resetButton,
                    color: theme === 'dark' ? '#9CA3AF' : '#737373',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
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
                    style={{
                      cursor: "pointer",
                    }}
                  >
                    <EllipsisIcon />
                  </button>
                )}
              </div>
              )}
            </div>
            {!tombstone && !isOwnRemoved && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* 🎨 CUSTOMIZATION: Heart icon styling */}
              <HeartButton
                userUpvoted={userUpvotedComment}
                handleUpvote={handleUpvoteComment}
                handleRemoveUpvote={handleRemoveCommentUpvote}
                iconSize={14}
                emptyColor={theme === 'dark' ? '#9CA3AF' : '#8E8E8E'}
                fullColor={theme === 'dark' ? '#F87171' : '#DC2626'}
                padding={4}
                paddingBottom={4}
              />
              <div
                style={{
                  // 🎨 CUSTOMIZATION: Likes count typography
                  fontSize: 12,
                  color: theme === 'dark' ? '#9CA3AF' : '#8E8E8E',
                  fontWeight: 400,
                }}
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
