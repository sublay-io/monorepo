import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import {
  Comment as CommentType,
  UserMention,
  getUserName,
  useCommentSection,
  useReactionToggle,
  useUser,
} from "@sublay/react-native";
import { parseContentWithMentions } from "~shared/react-native/parse-content-with-mentions";
import UserAvatar from "~shared/react-native/user-avatar";
import { getImageComponent } from "~shared/react-native/get-image-component";
import VoteButtons from "./vote-buttons";
import ActionMenu from "../action-menu";
import ToggleRepliesVisibility from "./toggle-replies-visibility";
import {
  AVATAR_GAP,
  AVATAR_OFFSET_TOP,
  AVATAR_SIZE,
  INDENT,
  MAX_INDENT_DEPTH,
  ROW_PADDING_Y,
  ThreadStem,
} from "./indentation-threading-lines";
import ReplyButtonAndInfo from "./reply-button-and-info";
import useUIState from "../../../../hooks/use-ui-state";

interface SingleCommentProps {
  comment: CommentType;
  depth: number;
  hasReplies: boolean;
  isCollapsed: boolean;
  replyCount: number;
  /** Replies (or the row that loads them) are listed under this comment. */
  showReplies: boolean;
  /** Past the indentation cap, the column's line carries on below this comment's thread. */
  columnContinues: boolean;
  onToggleCollapse: () => void;
}

// The viewer's own reaction on a comment they can't otherwise interact with
// (its author blocked them): undoing it is still allowed.
function RemoveOwnReactionButton({ comment }: { comment: CommentType }) {
  const { theme } = useUIState();
  const { currentReaction, toggleReaction } = useReactionToggle({
    targetType: "comment",
    targetId: comment.id,
    initialReaction: comment.userReaction,
    initialReactionCounts: comment.reactionCounts,
  });

  if (!currentReaction) return null;

  return (
    <Pressable
      onPress={() => toggleReaction({ reactionType: currentReaction })}
      className="px-2 py-1"
    >
      <Text
        className={`text-xs font-medium ${
          theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
        }`}
      >
        Remove your vote
      </Text>
    </Pressable>
  );
}

function SingleComment({
  comment,
  depth,
  hasReplies,
  isCollapsed,
  replyCount,
  showReplies,
  columnContinues,
  onToggleCollapse,
}: SingleCommentProps) {
  const { user } = useUser();
  const {
    callbacks,
    highlightedComment,
    repliedToComment,
    setRepliedToComment,
    setShowReplyBanner,
    handleDeepReply,
  } = useCommentSection();
  const { theme, focusCommentInput } = useUIState();
  const [showBlockedComment, setShowBlockedComment] = useState(false);

  // isUnavailable wins over every other marker (the author blocked the
  // viewer): a neutral row, no reply/react. A comment by someone the viewer
  // blocked starts collapsed, and can be shown (then replied to / reacted to).
  const isUnavailable = !!comment.isUnavailable;
  const isBlockedCollapsed =
    !isUnavailable && !!comment.isAuthorBlocked && !showBlockedComment;
  const isPlaceholderRow = isUnavailable || isBlockedCollapsed;
  // Reddit-style tombstone, after isUnavailable: a user-deleted comment, or a
  // moderator-removed one served as a placeholder (its author gets it in full,
  // with content, and sees it normally). Replies underneath stay visible.
  const tombstone = isUnavailable
    ? null
    : comment.userDeletedAt
      ? "[deleted]"
      : comment.moderationStatus === "removed" && !comment.userId
        ? "[removed]"
        : null;

  // The viewer's own moderator-removed comment comes back in full (only its
  // author sees it, with a note saying so). The server refuses votes on it and
  // direct replies to it, so there are no vote buttons or Reply; delete stays.
  const isOwnRemoved =
    !tombstone && comment.moderationStatus === "removed" && !!comment.userId;
  const ownRemovedLabel = `Removed by a moderator${
    comment.moderationReason ? `: ${comment.moderationReason}` : ""
  } · only you can see this`;

  // Dynamically get the correct Image component
  const { ImageComponent, isExpo } = getImageComponent();

  // How far this row sits in from the left edge of its thread. The highlight
  // reaches back across it, so a highlighted reply is coloured edge to edge.
  const indentationPx = Math.min(depth, MAX_INDENT_DEPTH) * INDENT;

  // Replies are written in the section's main input. Reply makes this comment
  // the reply target (the reply is nested under exactly this comment) and
  // opens the keyboard; Reply again on the same comment cancels it.
  const isReplyTarget = repliedToComment?.id === comment.id;
  const clearReplyTarget = () => {
    setRepliedToComment?.(null);
    setShowReplyBanner?.({ newState: false });
  };
  const handleReplyPress = () => {
    if (isReplyTarget) {
      clearReplyTarget();
      return;
    }
    handleDeepReply?.(comment);
    focusCommentInput?.();
  };

  // A comment that can no longer be replied to (deleted, removed or made
  // unavailable while it was the reply target) stops being the target.
  const cannotBeRepliedTo = isUnavailable || !!tombstone || isOwnRemoved;
  useEffect(() => {
    if (!isReplyTarget || !cannotBeRepliedTo) return;
    setRepliedToComment?.(null);
    setShowReplyBanner?.({ newState: false });
  }, [isReplyTarget, cannotBeRepliedTo, setRepliedToComment, setShowReplyBanner]);

  // The deep-linked comment, and the comment being replied to, are both
  // drawn highlighted.
  const isHighlighted =
    highlightedComment?.comment.id === comment.id || isReplyTarget;
  // 🎨 CUSTOMIZATION: Highlighted comment background: a neutral step away
  // from the section background
  const highlightClass = isHighlighted
    ? theme === 'dark'
      ? 'bg-[#333333]'
      : 'bg-gray-100'
    : '';
  // 🎨 CUSTOMIZATION: Highlight color on the indentation beside it
  const highlightGutterClass = isHighlighted
    ? theme === 'dark'
      ? 'bg-blue-950'
      : 'bg-blue-100'
    : '';

  // The API sends aspectRatio as a string (e.g. "1.5"), so coerce before doing
  // math with it. Falls back to 1 (square) if it's missing or unparsable.
  const gifAspectRatio = Number(comment.gif?.aspectRatio) || 1;

  const imageStyle = {
    width: gifAspectRatio > 1 ? 200 : 200 * gifAspectRatio,
    height: gifAspectRatio < 1 ? 200 : 200 / gifAspectRatio,
    borderRadius: 4,
    overflow: "hidden" as const,
    marginBottom: 12,
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

  return (
    <View
      className={highlightGutterClass}
      style={{
        marginLeft: -indentationPx,
        paddingLeft: indentationPx,
      }}
    >
      <View className={highlightClass} style={{ paddingVertical: ROW_PADDING_Y }}>
        {/* Line from this comment's avatar down to the rows listed under it */}
        {(showReplies || columnContinues) && <ThreadStem />}

        <View className="flex-row">
          {/* Avatar with threading line connection */}
          <View
            className="relative"
            style={{ marginRight: AVATAR_GAP, marginTop: AVATAR_OFFSET_TOP }}
          >
            {isPlaceholderRow || tombstone ? (
              <View
                className={`relative z-10 rounded-full ${
                  theme === 'dark' ? 'bg-neutral-700' : 'bg-gray-200'
                }`}
                style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
              />
            ) : (
              <Pressable
                className="relative z-10"
                onPress={() => {
                  if (user?.id === comment.user?.id) {
                    callbacks?.currentUserClickCallback?.();
                  } else {
                    callbacks?.otherUserClickCallback?.(comment.user?.id ?? "", comment.user?.foreignId);
                  }
                }}
              >
                <UserAvatar
theme={theme}
                  user={comment.user ?? {}}
                  borderRadius={AVATAR_SIZE}
                  size={AVATAR_SIZE}
                />
              </Pressable>
            )}
          </View>

          {/* Comment content area */}
          {isPlaceholderRow ? (
            <View className="flex-1 flex-row items-center gap-2 min-h-7">
              {isUnavailable ? (
                <>
                  <Text
                    className={`text-xs italic ${
                      theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
                    }`}
                  >
                    This comment is unavailable
                  </Text>
                  <RemoveOwnReactionButton comment={comment} />
                </>
              ) : (
                <>
                  <Text
                    className={`text-xs italic ${
                      theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
                    }`}
                  >
                    Comment from a user you blocked
                  </Text>
                  <Pressable onPress={() => setShowBlockedComment(true)}>
                    <Text
                      className={`text-xs font-medium ${
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      }`}
                    >
                      Show anyway
                    </Text>
                  </Pressable>
                </>
              )}
              {hasReplies && (
                <ToggleRepliesVisibility
                  isCollapsed={isCollapsed}
                  onToggleCollapse={onToggleCollapse}
                />
              )}
            </View>
          ) : (
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center gap-2">
                {tombstone ? (
                  <Text
                    className={`font-medium text-xs ${
                      theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
                    }`}
                  >
                    {tombstone}
                  </Text>
                ) : (
                <Pressable
                  onPress={() => {
                    if (user?.id === comment.user?.id) {
                      callbacks?.currentUserClickCallback?.();
                    } else {
                      callbacks?.otherUserClickCallback?.(comment.user?.id ?? "", comment.user?.foreignId);
                    }
                  }}
                >
                  <Text
                    className={`font-medium text-xs ${
                      theme === 'dark' ? 'text-neutral-300' : 'text-gray-700'
                    }`}
                  >
                    {getUserName(comment.user ?? {})}
                  </Text>
                </Pressable>
                )}
                <Text
                  className={`text-xs ${
                    theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
                  }`}
                >
                  •
                </Text>
                <Text
                  className={`text-xs ${
                    theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
                  }`}
                >
                  {new Date(comment.createdAt).toLocaleDateString()}
                </Text>
                {isCollapsed && hasReplies && (
                  <Text
                    className={`text-xs ${
                      theme === 'dark' ? 'text-blue-400' : 'text-blue-500'
                    }`}
                  >
                    ({replyCount} {replyCount === 1 ? "reply" : "replies"})
                  </Text>
                )}
                {hasReplies && (
                  <ToggleRepliesVisibility
                    isCollapsed={isCollapsed}
                    onToggleCollapse={onToggleCollapse}
                  />
                )}
              </View>
              {!tombstone && <ActionMenu comment={comment} />}
            </View>

            {!isCollapsed && tombstone && (
              <Text
                className={`text-xs italic mb-3 leading-relaxed ${
                  theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
                }`}
              >
                {tombstone}
              </Text>
            )}

            {!isCollapsed && !tombstone && (
              <>
                {comment.content && (
                  <Text
                    className={`text-xs mb-3 leading-relaxed ${
                      theme === 'dark' ? 'text-neutral-200' : 'text-gray-800'
                    }`}
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

                {comment.gif && (
                  <ImageComponent style={imageStyle} {...imageProps} />
                )}

                {isOwnRemoved && (
                  <Text
                    className={`text-xs mb-3 ${
                      theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
                    }`}
                  >
                    {ownRemovedLabel}
                  </Text>
                )}

                <View className="flex-row items-center justify-between">
                  <ReplyButtonAndInfo
                    hasReplies={replyCount > 0}
                    replyCount={replyCount}
                    onReplyPress={handleReplyPress}
                    canReply={!isOwnRemoved}
                  />
                  {/* Vote buttons inline with reply options */}
                  {!isOwnRemoved && (
                    <View>
                      <VoteButtons
                        comment={comment}
                        size="small"
                        highlighted={isHighlighted}
                      />
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default SingleComment;
