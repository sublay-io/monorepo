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
  SECTION_PADDING_X,
  ThreadStem,
} from "./indentation-threading-lines";
import ReplyButtonAndInfo from "./reply-button-and-info";
import useUIState from "../../../../hooks/use-ui-state";
import strings from "../../../../utils/strings";

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
      style={{
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          lineHeight: 18,
          fontWeight: '500',
          color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
        }}
      >
        {strings.removeYourVote}
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
      ? strings.deleted
      : comment.moderationStatus === "removed" && !comment.userId
        ? strings.removed
        : null;

  // The viewer's own moderator-removed comment comes back in full (only its
  // author sees it, with a note saying so). The server refuses votes on it and
  // direct replies to it, so there are no vote buttons or Reply; delete stays.
  const isOwnRemoved =
    !tombstone && comment.moderationStatus === "removed" && !!comment.userId;
  const ownRemovedLabel = strings.removedByModerator(comment.moderationReason);

  // Dynamically get the correct Image component
  const { ImageComponent, isExpo } = getImageComponent();

  // How far this row sits in from the start edge of its thread. The highlight
  // reaches back across it, so a highlighted reply is coloured edge to edge.
  const indentationPx = Math.min(depth, MAX_INDENT_DEPTH) * INDENT;
  // ...and on across the section's own side padding, to its edges.
  const highlightReachStart = indentationPx + SECTION_PADDING_X;

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

  // The reply target is only ever cleared by the user (Reply again, or the
  // bar's cancel). If the comment is deleted or removed meanwhile, the bar
  // stays and sending fails with a message, so a reply is never posted
  // somewhere the user did not choose.

  // One highlight at a time: while a reply is being written, the comment
  // being replied to; otherwise the deep-linked comment.
  const isHighlighted = repliedToComment?.id
    ? isReplyTarget
    : highlightedComment?.comment.id === comment.id;
  // 🎨 CUSTOMIZATION: Highlighted comment background: a neutral step away
  // from the section background
  const highlightColor = isHighlighted
    ? theme === 'dark'
      ? '#333333'
      : '#F3F4F6'
    : undefined;
  // 🎨 CUSTOMIZATION: Highlight color on the indentation beside it
  const highlightGutterColor = isHighlighted
    ? theme === 'dark'
      ? '#172554'
      : '#DBEAFE'
    : undefined;

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
      style={{
        backgroundColor: highlightGutterColor,
        marginStart: -highlightReachStart,
        marginEnd: -SECTION_PADDING_X,
        paddingStart: highlightReachStart,
      }}
    >
      <View
        style={{
          backgroundColor: highlightColor,
          paddingVertical: ROW_PADDING_Y,
          // The end padding is the section's own, carried here so the
          // comment's highlight (not the strip's color) fills it
          paddingEnd: SECTION_PADDING_X,
        }}
      >
        {/* Line from this comment's avatar down to the rows listed under it */}
        {(showReplies || columnContinues) && <ThreadStem />}

        <View style={{ flexDirection: 'row' }}>
          {/* Avatar with threading line connection */}
          <View
            style={{
              position: 'relative',
              marginEnd: AVATAR_GAP,
              marginTop: AVATAR_OFFSET_TOP,
            }}
          >
            {isPlaceholderRow || tombstone ? (
              <View
                style={{
                  position: 'relative',
                  zIndex: 10,
                  borderRadius: 9999,
                  // 🎨 CUSTOMIZATION: Placeholder avatar color
                  backgroundColor: theme === 'dark' ? '#404040' : '#E5E7EB',
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                }}
              />
            ) : (
              <Pressable
                style={{
                  position: 'relative',
                  zIndex: 10,
                }}
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
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                minHeight: 28,
              }}
            >
              {isUnavailable ? (
                <>
                  <Text
                    style={{
                      fontSize: 13,
                      lineHeight: 18,
                      fontStyle: 'italic',
                      color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
                    }}
                  >
                    {strings.unavailable}
                  </Text>
                  <RemoveOwnReactionButton comment={comment} />
                </>
              ) : (
                <>
                  <Text
                    style={{
                      fontSize: 13,
                      lineHeight: 18,
                      fontStyle: 'italic',
                      color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
                    }}
                  >
                    {strings.blockedAuthor}
                  </Text>
                  <Pressable onPress={() => setShowBlockedComment(true)}>
                    <Text
                      style={{
                        fontSize: 13,
                        lineHeight: 18,
                        fontWeight: '500',
                        color: theme === 'dark' ? '#60A5FA' : '#2563EB',
                      }}
                    >
                      {strings.showAnyway}
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
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {tombstone ? (
                  <Text
                    style={{
                      fontWeight: '500',
                      fontSize: 13,
                      lineHeight: 18,
                      color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
                    }}
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
                    style={{
                      fontWeight: '500',
                      fontSize: 13,
                      lineHeight: 18,
                      // 🎨 CUSTOMIZATION: Author name color
                      color: theme === 'dark' ? '#FFFFFF' : '#374151',
                    }}
                  >
                    {getUserName(comment.user ?? {})}
                  </Text>
                </Pressable>
                )}
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: 18,
                    color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
                  }}
                >
                  •
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: 18,
                    color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
                  }}
                >
                  {new Date(comment.createdAt).toLocaleDateString()}
                </Text>
                {isCollapsed && hasReplies && (
                  <Text
                    style={{
                      fontSize: 13,
                      lineHeight: 18,
                      color: theme === 'dark' ? '#60A5FA' : '#3B82F6',
                    }}
                  >
                    ({strings.replyCount(replyCount)})
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
                style={{
                  fontSize: 13,
                  lineHeight: 21,
                  fontStyle: 'italic',
                  marginBottom: 12,
                  color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
                }}
              >
                {tombstone}
              </Text>
            )}

            {!isCollapsed && !tombstone && (
              <>
                {comment.content && (
                  <Text
                    style={{
                      fontSize: 13,
                      lineHeight: 21,
                      marginBottom: 12,
                      // 🎨 CUSTOMIZATION: Comment body color
                      color: theme === 'dark' ? '#E5E5E5' : '#1F2937',
                    }}
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
                    style={{
                      fontSize: 13,
                      lineHeight: 18,
                      marginBottom: 12,
                      color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
                    }}
                  >
                    {ownRemovedLabel}
                  </Text>
                )}

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
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
