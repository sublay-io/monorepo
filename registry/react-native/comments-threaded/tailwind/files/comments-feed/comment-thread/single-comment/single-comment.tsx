import { cloneElement, useState } from "react";
import { View, Text, Pressable } from "react-native";
import {
  Comment as CommentType,
  UserMention,
  getUserName,
  useCommentSection,
  useReactionToggle,
  useUser,
  type CommentCreateError,
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
import IndentationThreadingLines, {
  AVATAR_GAP,
  AVATAR_OFFSET_TOP,
  AVATAR_SIZE,
  INDENT,
  MAX_INDENT_DEPTH,
  ROW_PADDING_Y,
  ThreadStem,
} from "./indentation-threading-lines";
import ReplyButtonAndInfo from "./reply-button-and-info";
import { getCommentCreateErrorMessage } from "../../../../utils/comment-create-error";
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

// 🎨 CUSTOMIZATION: Where the threading line meets the reply form, measured
// from the top of the form's row (Default: 30, level with its first line)
const REPLY_FORM_JOIN_Y = 30;

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
  const { callbacks, highlightedComment, createError } = useCommentSection();
  const { theme } = useUIState();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  // A reply to this comment that wasn't posted: the message shows under the
  // reply form, until the text is edited or something is sent again (the
  // section clears `createError` then). If the reply was refused because this
  // comment was deleted or removed in the meantime, the row has already turned
  // into its placeholder (no reply form), so the message shows on the row.
  const [dismissedReplyError, setDismissedReplyError] =
    useState<CommentCreateError | null>(null);
  const replyErrorMessage =
    createError &&
    createError.parentId === comment.id &&
    createError !== dismissedReplyError
      ? getCommentCreateErrorMessage(createError)
      : null;
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

  // The reply form is a row of its own under the comment, first on the line
  // its replies hang from.
  const showForm =
    showReplyForm &&
    !isPlaceholderRow &&
    !isCollapsed &&
    !tombstone &&
    !isOwnRemoved;

  const isHighlighted = highlightedComment?.comment.id === comment.id;
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
    <>
    <View
      className={highlightGutterClass}
      style={{
        marginLeft: -indentationPx,
        paddingLeft: indentationPx,
      }}
    >
      <View className={highlightClass} style={{ paddingVertical: ROW_PADDING_Y }}>
        {/* Line from this comment's avatar down to the rows listed under it */}
        {(showReplies || showForm || columnContinues) && <ThreadStem />}

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

            {!isCollapsed && tombstone && replyErrorMessage ? (
              <Text
                accessibilityRole="alert"
                className={`text-xs mb-3 ${
                  theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
                }`}
              >
                {replyErrorMessage}
              </Text>
            ) : null}

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
                      callbacks?.otherUserClickCallback
                    ).map((part) =>
                      // Mentions come back with a fixed color: restyle them to follow the theme
                      typeof part === "string"
                        ? part
                        : cloneElement(part, {
                            // 🎨 CUSTOMIZATION: Mention color (Default: blue-800)
                            style: { color: theme === 'dark' ? "#60A5FA" : "#1E40AF" },
                          })
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

                {isOwnRemoved && replyErrorMessage ? (
                  <Text
                    accessibilityRole="alert"
                    className={`text-xs mb-3 ${
                      theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
                    }`}
                  >
                    {replyErrorMessage}
                  </Text>
                ) : null}

                <View className="flex-row items-center justify-between">
                  <ReplyButtonAndInfo
                    hasReplies={replyCount > 0}
                    replyCount={replyCount}
                    setShowReplyForm={setShowReplyForm}
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

    {/* Reply form: lined up with the comment's content, and pulled up into
        the row's bottom padding so it sits right under the reply button */}
    {showForm && (
      <View
        className={highlightGutterClass}
        style={{
          marginTop: -ROW_PADDING_Y,
          marginLeft: -indentationPx,
          paddingLeft: indentationPx,
        }}
      >
        <View className={highlightClass}>
          <View
            style={{
              marginLeft: INDENT,
              paddingLeft: AVATAR_SIZE + AVATAR_GAP - INDENT,
              paddingBottom: ROW_PADDING_Y,
            }}
          >
            <NewReplyForm
              comment={comment}
              setShowReplyForm={setShowReplyForm}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              errorMessage={replyErrorMessage}
              onDismissError={() => {
                if (replyErrorMessage) setDismissedReplyError(createError ?? null);
              }}
            />
            <IndentationThreadingLines
              isLastReply={!showReplies && !columnContinues}
              joinAt={REPLY_FORM_JOIN_Y}
              reach={AVATAR_SIZE + AVATAR_GAP - INDENT}
            />
          </View>
        </View>
      </View>
    )}
    </>
  );
}

export default SingleComment;
