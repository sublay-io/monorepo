import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import {
  Comment as CommentType,
  UserMention,
  getUserName,
  useCommentSection,
  useReactionToggle,
  useUser,
} from "@sublay/react-native";
import {
  parseContentWithMentions,
  UserAvatar,
  getImageComponent,
} from "@sublay/ui-core-react-native";
import VoteButtons from "./vote-buttons";
import ActionMenu from "../action-menu";
import NewReplyForm from "../new-reply-form";
import ToggleRepliesVisibility from "./toggle-replies-visibility";
import IndentationThreadingLines from "./indentation-threading-lines";
import ReplyButtonAndInfo from "./reply-button-and-info";
import useUIState from "../../../../hooks/use-ui-state";

interface SingleCommentProps {
  comment: CommentType;
  depth: number;
  hasReplies: boolean;
  isCollapsed: boolean;
  replyCount: number;
  isLastReply?: boolean;
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
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}
      >
        Remove your vote
      </Text>
    </Pressable>
  );
}

function SingleComment({
  comment: commentFromSection,
  depth,
  hasReplies,
  isCollapsed,
  replyCount,
  isLastReply = false,
  onToggleCollapse,
}: SingleCommentProps) {
  const { user } = useUser();
  const { callbacks, highlightedComment } = useCommentSection();
  const { theme } = useUIState();
  const comment = commentFromSection;
  const [showReplyForm, setShowReplyForm] = useState(false);
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
  // author sees it). Voting on it is refused by the server, so there are no
  // vote buttons; reply and delete stay.
  const isOwnRemoved =
    !tombstone && comment.moderationStatus === "removed" && !!comment.userId;

  // Dynamically get the correct Image component
  const { ImageComponent, isExpo } = getImageComponent();

  const maxDepth = 6; // Limit visual nesting depth
  const actualDepth = Math.min(depth, maxDepth);

  // Calculate progressive indentation
  const indentationPx = actualDepth * 24; // 24px per level

  const isHighlighted = highlightedComment?.comment.id === comment.id;

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
      className={`relative ${
        isHighlighted
          ? theme === 'dark'
            ? 'bg-blue-900'
            : 'bg-blue-100'
          : ''
      }`}
      style={{
        marginLeft: indentationPx,
      }}
    >
      {/* Threading lines - positioned behind avatars */}
      {actualDepth > 0 && (
        <IndentationThreadingLines isLastReply={isLastReply} />
      )}

      <View className="py-2 rounded-md">
        <View className="flex-row">
          {/* Avatar with threading line connection */}
          <View className="mr-3 relative mt-1">
            {isPlaceholderRow || tombstone ? (
              <View
                className={`relative z-10 w-6 h-6 rounded-full ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}
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
                  user={comment.user ?? {}}
                  borderRadius={24}
                  size={24}
                />
              </Pressable>
            )}
            {/* Vertical line extending down from this comment's avatar when it has replies */}
            {hasReplies && !isCollapsed && (
              <View
                className={`absolute w-px z-0 ${
                  theme === 'dark' ? 'bg-gray-500' : 'bg-gray-300'
                }`}
                style={{
                  left: '50%',
                  top: 20,
                  height: '100%',
                  marginLeft: -0.5,
                }}
              />
            )}
          </View>

          {/* Comment content area */}
          {isPlaceholderRow ? (
            <View className="flex-1 flex-row items-center gap-2 min-h-7">
              {isUnavailable ? (
                <>
                  <Text
                    className={`text-xs italic ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
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
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
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
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
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
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    {getUserName(comment.user ?? {})}
                  </Text>
                </Pressable>
                )}
                <Text
                  className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  •
                </Text>
                <Text
                  className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
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
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
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
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
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

                {comment.gif && (
                  <ImageComponent style={imageStyle} {...imageProps} />
                )}

                <View className="flex-row items-center justify-between">
                  <ReplyButtonAndInfo
                    hasReplies={replyCount > 0}
                    replyCount={replyCount}
                    setShowReplyForm={setShowReplyForm}
                  />
                  {/* Vote buttons inline with reply options */}
                  {!isOwnRemoved && (
                    <View>
                      <VoteButtons
                        comment={comment}
                        size="small"
                      />
                    </View>
                  )}
                </View>

                {/* Reply form */}
                {showReplyForm && (
                  <NewReplyForm
                    comment={comment}
                    setShowReplyForm={setShowReplyForm}
                  />
                )}
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
