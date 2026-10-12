import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
import UserAvatar from "~shared/react-native/user-avatar";
import FromNow from "~shared/react-native/from-now";
import { parseContentWithMentions } from "~shared/react-native/parse-content-with-mentions";
import { getImageComponent } from "~shared/react-native/get-image-component";
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

    // 🎨 CUSTOMIZATION: Comment styling defaults
    const horizontalItemsGap = 8;
    const verticalItemsGap = 4;
    const authorAvatarSize = 32;
    const authorFontSize = 13;
    const authorFontWeight = '700' as const;
    const authorFontColor = theme === 'dark' ? '#FAFAFA' : '#000';
    const fromNowFontSize = 12;
    const fromNowFontColor = theme === 'dark' ? '#A3A3A3' : '#737373';
    const commentBodyFontSize = 13;
    const commentBodyFontColor = theme === 'dark' ? '#FAFAFA' : '#000';
    const actionsItemGap = 12;
    const replyButtonFontSize = 12;
    const replyButtonFontWeight = '600' as const;
    const replyButtonFontColor = theme === 'dark' ? '#A3A3A3' : '#737373';
    const heartIconSize = 14;
    const heartIconEmptyColor = theme === 'dark' ? '#A3A3A3' : '#8E8E8E';
    const heartIconFullColor = theme === 'dark' ? '#F87171' : '#DC2626';
    const heartIconPaddingBottom = 2;
    const likesCountFontSize = 11;
    const likesCountFontWeight = '600' as const;
    const likesCountFontColor = theme === 'dark' ? '#A3A3A3' : '#8E8E8E';

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
          source: comment.gif?.gifUrl, // expo-image accepts a string
          contentFit: "cover" as const,
          transition: 1000,
          placeholder: comment.gif?.gifPreviewUrl,
        }
      : {
          source: { uri: comment.gif?.gifUrl }, // React Native's Image requires { uri: ... }
        };

    return (
      <View
        style={{
          paddingVertical: 8,
          // 🎨 CUSTOMIZATION: Highlighted comment background
          backgroundColor:
            highlightedComment?.comment.id === comment.id
              ? (theme === 'dark' ? "#333333" : "#dbeafe")
              : "transparent",
        }}
      >
        {isPlaceholderRow ? (
          <View
            style={{
              paddingRight: 16,
              paddingLeft: 16 + extraLeftPadding,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 32,
                backgroundColor: theme === 'dark' ? '#404040' : '#E5E7EB',
              }}
            />
            <Text
              style={{
                fontSize: 13,
                fontStyle: "italic",
                color: theme === 'dark' ? '#A3A3A3' : '#737373',
              }}
            >
              {isUnavailable
                ? "This comment is unavailable"
                : "Comment from a user you blocked"}
            </Text>
            {isUnavailable ? (
              currentReaction && (
                <TouchableOpacity
                  onPress={() => toggleReaction({ reactionType: currentReaction })}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: theme === 'dark' ? '#A3A3A3' : '#737373',
                    }}
                  >
                    Remove your reaction
                  </Text>
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity onPress={() => setShowBlockedComment(true)}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: theme === 'dark' ? '#FAFAFA' : '#000',
                  }}
                >
                  Show anyway
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
        <Pressable
          onLongPress={tombstone ? undefined : () => {
            Vibration.vibrate(50);
            // Open appropriate sheet based on ownership
            if (isOwner) {
              openCommentOptionsSheetOwner!(comment);
            } else {
              openCommentOptionsSheet!(comment);
            }
            Keyboard.dismiss();
          }}
          style={{
            ...styles.container,
            paddingRight: 16,
            paddingLeft: 16 + extraLeftPadding,
          }}
        >
          <View style={[styles.commentHeader, { gap: horizontalItemsGap }]}>
            {tombstone ? (
              <View
                style={{
                  width: authorAvatarSize,
                  height: authorAvatarSize,
                  borderRadius: authorAvatarSize,
                  backgroundColor: theme === 'dark' ? '#404040' : '#E5E7EB',
                }}
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
theme={theme}
                user={comment.user ?? {}}
                borderRadius={authorAvatarSize}
                size={authorAvatarSize}
              />
            </Pressable>
            )}
            <View style={[styles.commentBody, { gap: verticalItemsGap }]}>
              <View style={styles.commentMeta}>
                {tombstone ? (
                  <Text
                    style={{
                      fontWeight: authorFontWeight,
                      fontSize: authorFontSize,
                      color: theme === 'dark' ? '#A3A3A3' : '#737373',
                    }}
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
                    style={[
                      styles.authorText,
                      {
                        fontWeight: authorFontWeight,
                        fontSize: authorFontSize,
                        color: authorFontColor,
                      },
                    ]}
                  >
                    {getUserName(comment.user ?? {}, "username")}
                  </Text>
                </Pressable>
                )}
                <FromNow
                  time={comment.createdAt}
                  fontSize={fromNowFontSize}
                  color={fromNowFontColor}
                />
              </View>

              {tombstone && (
                <Text
                  style={{
                    fontSize: commentBodyFontSize,
                    fontStyle: "italic",
                    color: theme === 'dark' ? '#A3A3A3' : '#737373',
                  }}
                >
                  {tombstone}
                </Text>
              )}
              {!tombstone && comment.content && (
                <Text
                  style={[
                    styles.commentText,
                    {
                      fontSize: commentBodyFontSize,
                      color: commentBodyFontColor,
                    },
                  ]}
                >
                  {parseContentWithMentions(
                    comment.content,
                    comment.mentions
                      ?.filter((m): m is UserMention => 'username' in m)
                      .map((m) => ({ id: m.id, foreignId: m.foreignId ?? undefined, username: m.username })),
                    user?.id,
                    callbacks?.currentUserClickCallback,
                    callbacks?.otherUserClickCallback,
                    theme
                  )}
                </Text>
              )}
              {!tombstone && comment.gif?.gifUrl && (
                <ImageComponent style={imageStyle} {...imageProps} />
              )}

              {isOwnRemoved && (
                <Text
                  style={{
                    fontSize: 12,
                    color: theme === 'dark' ? '#A3A3A3' : '#737373',
                  }}
                >
                  {ownRemovedLabel}
                </Text>
              )}

              {!tombstone && canReply && (
              <View style={[styles.actionsContainer, { gap: actionsItemGap }]}>
                <TouchableOpacity
                  onPress={() =>
                    comment.parentId
                      ? handleShallowReply!(comment)
                      : handleDeepReply!(comment)
                  }
                  style={styles.replyButton}
                >
                  <Text
                    style={{
                      color: replyButtonFontColor,
                      fontSize: replyButtonFontSize,
                      fontWeight: replyButtonFontWeight,
                    }}
                  >
                    Reply
                  </Text>
                </TouchableOpacity>
              </View>
              )}
            </View>
            {!tombstone && !isOwnRemoved && (
            <View style={styles.likesContainer}>
              <HeartButton
                userUpvoted={userUpvotedComment}
                handleUpvote={handleUpvoteComment}
                handleRemoveUpvote={handleRemoveCommentUpvote}
                iconSize={heartIconSize}
                emptyColor={heartIconEmptyColor}
                fullColor={heartIconFullColor}
                padding={4}
                paddingBottom={heartIconPaddingBottom}
              />
              <Text
                style={{
                  fontSize: likesCountFontSize,
                  color: likesCountFontColor,
                  fontWeight: likesCountFontWeight,
                }}
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

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  commentHeader: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  commentBody: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  commentMeta: {
    display: "flex",
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginTop: 2,
  },
  authorText: {
    // Custom styles if needed
  },
  commentText: {
    // Custom styles if needed
  },
  actionsContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  replyButton: {
    // Custom styles if needed
  },
  likesContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
});

Comment.displayName = "Comment";

export default Comment;
