import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Vibration,
  Pressable,
  Keyboard,
} from "react-native";
import {
  Comment as CommentType,
  UserMention,
  useReactionToggle,
  useCommentSection,
  useUser,
  getUserName,
} from "@sublay/react-native";
import {
  UserAvatar,
  FromNow,
  parseContentWithMentions,
  getImageComponent,
} from "@sublay/ui-core-react-native";
import { Replies } from "./replies";
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
    // Dynamically get the correct Image component and whether it is expo-image.
    const { ImageComponent, isExpo } = getImageComponent();

    const { user } = useUser();
    const { handleShallowReply, handleDeepReply, callbacks, highlightedComment } =
      useCommentSection();
    const { theme, openCommentOptionsSheet, openCommentOptionsSheetOwner } = useUIState();

    // CUSTOMIZATION: Comment styling defaults
    const authorAvatarSize = 32;
    const heartIconSize = 14;
    const heartIconEmptyColor = theme === 'dark' ? '#9CA3AF' : '#8E8E8E';
    const heartIconFullColor = theme === 'dark' ? '#F87171' : '#DC2626';

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
    const isOwner = comment.userId === user?.id;

    // The API sends aspectRatio as a string (e.g. "1.5"), so coerce before
    // doing math with it. Falls back to 1 (square) if it's missing or unparsable.
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

    const imageStyle = {
      width: gifAspectRatio > 1 ? 200 : 200 * gifAspectRatio,
      height: gifAspectRatio < 1 ? 200 : 200 / gifAspectRatio,
      borderRadius: 4,
      overflow: "hidden" as const,
    };

    const imageProps = isExpo
      ? {
          source: comment.gif?.gifUrl,
          contentFit: "cover" as const,
          transition: 1000,
          placeholder: comment.gif?.gifPreviewUrl,
        }
      : {
          source: { uri: comment.gif?.gifUrl },
        };

    const isHighlighted = highlightedComment?.comment.id === comment.id;

    return (
      <View
        className={`py-2 ${
          isHighlighted
            ? theme === 'dark'
              ? 'bg-blue-800'
              : 'bg-blue-100'
            : 'bg-transparent'
        }`}
      >
        {isPlaceholderRow ? (
          <View
            className="w-full pr-4 flex-row items-center gap-3"
            style={{ paddingLeft: 16 + extraLeftPadding }}
          >
            <View
              className={`w-8 h-8 rounded-full ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            />
            <Text
              className={`text-[13px] italic ${
                theme === 'dark' ? 'text-gray-400' : 'text-neutral-500'
              }`}
            >
              {isUnavailable
                ? "This comment is unavailable"
                : "Comment from a user you blocked"}
            </Text>
            {isUnavailable ? (
              currentReaction && (
                <Pressable
                  onPress={() => toggleReaction({ reactionType: currentReaction })}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      theme === 'dark' ? 'text-gray-400' : 'text-neutral-500'
                    }`}
                  >
                    Remove your reaction
                  </Text>
                </Pressable>
              )
            ) : (
              <Pressable onPress={() => setShowBlockedComment(true)}>
                <Text
                  className={`text-xs font-semibold ${
                    theme === 'dark' ? 'text-gray-50' : 'text-black'
                  }`}
                >
                  Show anyway
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
        <Pressable
          onLongPress={tombstone ? undefined : () => {
            Vibration.vibrate(50);
            if (isOwner) {
              openCommentOptionsSheetOwner!(comment);
            } else {
              openCommentOptionsSheet!(comment);
            }
            Keyboard.dismiss();
          }}
          className="w-full pr-4"
          style={{ paddingLeft: 16 + extraLeftPadding }}
        >
          <View className="flex-row items-start gap-2">
            {tombstone ? (
              <View
                className={`w-8 h-8 rounded-full ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              />
            ) : (
            <Pressable
              onPress={() => {
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
              <UserAvatar
                user={comment.user ?? {}}
                borderRadius={authorAvatarSize}
                size={authorAvatarSize}
              />
            </Pressable>
            )}
            <View className="flex-1 flex-col gap-1">
              <View className="flex-row items-baseline gap-1 mt-0.5">
                {tombstone ? (
                  <Text
                    className={`text-[13px] font-bold ${
                      theme === 'dark' ? 'text-gray-400' : 'text-neutral-500'
                    }`}
                  >
                    {tombstone}
                  </Text>
                ) : (
                <Pressable
                  onPress={() => {
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
                  <Text
                    className={`text-[13px] font-bold ${
                      theme === 'dark' ? 'text-gray-50' : 'text-black'
                    }`}
                  >
                    {getUserName(comment.user ?? {}, "username")}
                  </Text>
                </Pressable>
                )}
                <FromNow
                  time={comment.createdAt}
                  fontSize={12}
                  color={theme === 'dark' ? '#9CA3AF' : '#737373'}
                />
              </View>

              {tombstone && (
                <Text
                  className={`text-[13px] italic ${
                    theme === 'dark' ? 'text-gray-400' : 'text-neutral-500'
                  }`}
                >
                  {tombstone}
                </Text>
              )}
              {!tombstone && comment.content && (
                <Text
                  className={`text-[13px] ${
                    theme === 'dark' ? 'text-gray-50' : 'text-black'
                  }`}
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
                </Text>
              )}
              {!tombstone && comment.gif?.gifUrl && (
                <ImageComponent style={imageStyle} {...imageProps} />
              )}

              {isOwnRemoved && (
                <Text
                  className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-neutral-500'
                  }`}
                >
                  {ownRemovedLabel}
                </Text>
              )}

              {!tombstone && canReply && (
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={() =>
                    comment.parentId
                      ? handleShallowReply!(comment)
                      : handleDeepReply!(comment)
                  }
                >
                  <Text
                    className={`text-xs font-semibold ${
                      theme === 'dark' ? 'text-gray-400' : 'text-neutral-500'
                    }`}
                  >
                    Reply
                  </Text>
                </TouchableOpacity>
              </View>
              )}
            </View>
            {!tombstone && !isOwnRemoved && (
            <View className="flex-col items-center">
              <HeartButton
                userUpvoted={userUpvotedComment}
                handleUpvote={handleUpvoteComment}
                handleRemoveUpvote={handleRemoveCommentUpvote}
                iconSize={heartIconSize}
                emptyColor={heartIconEmptyColor}
                fullColor={heartIconFullColor}
                padding={4}
                paddingBottom={2}
              />
              <Text
                className={`text-[11px] font-semibold ${
                  theme === 'dark' ? 'text-gray-400' : 'text-neutral-500'
                }`}
              >
                {reactionCounts.like || 0}
              </Text>
            </View>
            )}
          </View>
        </Pressable>
        )}
        {!comment.parentId && <Replies commentId={comment.id} />}
      </View>
    );
  }
);

Comment.displayName = "Comment";

export default Comment;
