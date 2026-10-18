import { useContext, useState } from "react";
import {
  Comment as CommentType,
  type CommentCreateError,
  type Mention,
  UserMention,
  getUserName,
  useCommentSection,
  useReactionToggle,
  useUser,
} from "@sublay/react-js";
import { parseContentWithMentions } from "~shared/react/parse-content-with-mentions";
import UserAvatar from "~shared/react/user-avatar";
import VoteButtons from "./vote-buttons";
import ActionMenu from "../action-menu";
import NewReplyForm from "../new-reply-form";
import IndentationThreadingLines, {
  AVATAR_GAP,
  AVATAR_OFFSET_TOP,
  AVATAR_SIZE,
  INDENT,
  MAX_INDENT_DEPTH,
  ROW_PADDING_Y,
  SECTION_PADDING_X,
  ThreadStem,
  ThreadCollapseButton,
  ThreadLineContext,
  circleInlineStart,
} from "./indentation-threading-lines";
import ReplyButtonAndInfo from "./reply-button-and-info";
import { getCommentCreateErrorMessage } from "../../../../utils/comment-create-error";
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
  onToggleCollapse: () => void;
}

// 🎨 CUSTOMIZATION: Where the threading line meets the reply form, measured
// from the top of the form's row (Default: 32px, level with its first line)
const REPLY_FORM_JOIN_Y = 32;

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
    <button
      onClick={() => toggleReaction({ reactionType: currentReaction })}
      style={{
        fontSize: "13px",
        color: theme === 'dark' ? "#A3A3A3" : "#6B7280",
        fontWeight: 500,
        padding: "4px 8px",
        marginInlineStart: "-8px",
        borderRadius: "4px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
      }}
    >
      {strings.removeYourVote}
    </button>
  );
}

function SingleComment({
  comment,
  depth,
  hasReplies,
  isCollapsed,
  replyCount,
  showReplies,
  onToggleCollapse,
}: SingleCommentProps) {
  const { user } = useUser();
  const { callbacks, highlightedComment, createError } = useCommentSection();
  const { theme } = useUIState();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyMentions, setReplyMentions] = useState<Mention[]>([]);
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

  // How far this row sits in from the start edge of its thread. The highlight
  // reaches back across it, so a highlighted reply is coloured edge to edge.
  const indentationPx = Math.min(depth, MAX_INDENT_DEPTH) * INDENT;
  // ...and on across the section's own side padding, to its edges.
  const highlightReachStart = indentationPx + SECTION_PADDING_X;

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
  // from the section background (Default: gray-100)
  const highlightColor = isHighlighted
    ? (theme === 'dark' ? "#333333" : "#F3F4F6")
    : "transparent";
  // 🎨 CUSTOMIZATION: Highlight color on the indentation beside it (Default: blue-100)
  // This comment's line (see ThreadLineContext)
  const line = useContext(ThreadLineContext);
  // The collapse circle's background: the row's, so the line seems to pass
  // behind it
  const circleBackgroundColor = isHighlighted
    ? (theme === 'dark' ? "#333333" : "#F3F4F6")
    : (theme === 'dark' ? "#262626" : "#FFFFFF");
  const highlightGutterColor = isHighlighted
    ? (theme === 'dark' ? "#172554" : "#DBEAFE")
    : "transparent";

  // The API sends aspectRatio as a string (e.g. "1.5"), so coerce before doing
  // math with it. Falls back to 1 (square) if it's missing or unparsable.
  const gifAspectRatio = Number(comment.gif?.aspectRatio) || 1;

  return (
    <>
    <div
      style={{
        marginInlineStart: `-${highlightReachStart}px`,
        marginInlineEnd: `-${SECTION_PADDING_X}px`,
        paddingInlineStart: `${highlightReachStart}px`,
        backgroundColor: highlightGutterColor,
      }}
    >
      <div
        style={{
          position: "relative",
          backgroundColor: highlightColor,
          // The end padding is the section's own, carried here so the
          // comment's highlight (not the strip's color) fills it
          paddingBlock: `${ROW_PADDING_Y}px`,
          paddingInlineEnd: `${SECTION_PADDING_X}px`,
          transition: "background-color 150ms ease-in-out",
        }}
      >
        {/* Line from this comment's avatar down to the rows listed under it */}
        {(showReplies || showForm) && <ThreadStem line={line} />}

        <div
          style={{
            display: "flex",
            // Collapsed: one row, the ⊕ level with the name and text
            ...(isCollapsed ? { alignItems: "center", cursor: "pointer" } : {}),
          }}
          // A collapsed comment is one row: clicking it expands it
          onClick={isCollapsed ? onToggleCollapse : undefined}
        >
          {/* Avatar positioned for threading line connection with top margin */}
          <div
            style={{
              flexShrink: 0,
              marginInlineEnd: `${AVATAR_GAP}px`,
              position: "relative",
              marginTop: isCollapsed ? 0 : `${AVATAR_OFFSET_TOP}px`,
            }}
          >
            {isCollapsed && line ? (
              // Collapsed: ⊕ in place of the avatar, centered on the line
              <div
                style={{
                  position: "relative",
                  width: `${AVATAR_SIZE}px`,
                  height: `${AVATAR_SIZE}px`,
                }}
              >
                <ThreadCollapseButton
                  line={line}
                  collapsed
                  backgroundColor={circleBackgroundColor}
                  style={{
                    insetInlineStart: circleInlineStart(0),
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
              </div>
            ) : isPlaceholderRow || tombstone ? (
              <div
                style={{
                  position: "relative",
                  zIndex: 10,
                  width: `${AVATAR_SIZE}px`,
                  height: `${AVATAR_SIZE}px`,
                  borderRadius: `${AVATAR_SIZE}px`,
                  backgroundColor: theme === 'dark' ? "#404040" : "#E5E7EB",
                }}
              />
            ) : (
              <div
                style={{ position: "relative", zIndex: 10, cursor: "pointer" }}
                onClick={(event) => {
                  event.stopPropagation();
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
              </div>
            )}
          </div>

          {/* Comment content area */}
          {isPlaceholderRow ? (
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                minHeight: "28px",
                fontSize: "13px",
                fontStyle: "italic",
                color: theme === 'dark' ? "#A3A3A3" : "#6B7280",
              }}
            >
              {isUnavailable ? (
                <>
                  <span>{strings.unavailable}</span>
                  <RemoveOwnReactionButton comment={comment} />
                </>
              ) : (
                <>
                  <span>{strings.blockedAuthor}</span>
                  <button
                    onClick={() => setShowBlockedComment(true)}
                    style={{
                      fontSize: "13px",
                      fontStyle: "normal",
                      fontWeight: 500,
                      color: theme === 'dark' ? "#60A5FA" : "#2563EB",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    {strings.showAnyway}
                  </button>
                </>
              )}
            </div>
          ) : (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                // 🎨 CUSTOMIZATION: Spacing (Default: 4px, derived from 8/2)
                marginBottom: isCollapsed ? 0 : "4px",
                // As tall as the avatar, so the name and date sit level with it
                minHeight: `${AVATAR_SIZE}px`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  minWidth: 0,
                  alignItems: "center",
                  // 🎨 CUSTOMIZATION: Spacing (Default: 8px)
                  gap: "8px",
                  // 🎨 CUSTOMIZATION: Typography - Timestamp (Default: 13px)
                  fontSize: "13px",
                  // 🎨 CUSTOMIZATION: Typography - Timestamp (Default: gray-500)
                  color: theme === 'dark' ? "#A3A3A3" : "#6B7280",
                }}
              >
                {tombstone ? (
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: "13px",
                      color: theme === 'dark' ? "#A3A3A3" : "#6B7280",
                    }}
                  >
                    {tombstone}
                  </span>
                ) : (
                <span
                  style={{
                    // 🎨 CUSTOMIZATION: Typography - Author (Default: medium)
                    fontWeight: 500,
                    // 🎨 CUSTOMIZATION: Typography - Author (Default: 13px)
                    fontSize: "13px",
                    // 🎨 CUSTOMIZATION: Typography - Author (Default: gray-700, white in dark mode)
                    color: theme === 'dark' ? "#FFFFFF" : "#374151",
                    cursor: "pointer",
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (user?.id === comment.user?.id) {
                      callbacks?.currentUserClickCallback?.();
                    } else {
                      callbacks?.otherUserClickCallback?.(comment.user?.id ?? "", comment.user?.foreignId);
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = "underline";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = "none";
                  }}
                >
                  {getUserName(comment.user ?? {})}
                </span>
                )}
                <span style={{ color: theme === 'dark' ? "#A3A3A3" : "#6B7280" }}>•</span>
                <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                {/* Collapsed: the text on the same line, cut to fit */}
                {isCollapsed && !tombstone && comment.content ? (
                  <>
                    <span style={{ color: theme === 'dark' ? "#A3A3A3" : "#6B7280" }}>•</span>
                    <span
                      dir="auto"
                      style={{
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {comment.content.replace(/\s+/g, " ")}
                    </span>
                  </>
                ) : null}
              </div>
              {!tombstone && !isCollapsed && <ActionMenu comment={comment} />}
            </div>

            {!isCollapsed && tombstone && (
              <p
                style={{
                  fontSize: "13px",
                  fontStyle: "italic",
                  color: theme === 'dark' ? "#A3A3A3" : "#6B7280",
                  marginBottom: "12px",
                  lineHeight: "1.625",
                }}
              >
                {tombstone}
              </p>
            )}

            {!isCollapsed && tombstone && replyErrorMessage && (
              <p
                role="alert"
                style={{
                  fontSize: "13px",
                  color: theme === 'dark' ? "#A3A3A3" : "#6B7280",
                  marginBottom: "12px",
                }}
              >
                {replyErrorMessage}
              </p>
            )}

            {!isCollapsed && !tombstone && (
              <>
                {comment.content && (
                  <p
                    // A comment reads in the direction of its own text, whatever the
                    // direction of the page
                    dir="auto"
                    style={{
                      // 🎨 CUSTOMIZATION: Typography - Comment body (Default: 13px)
                      fontSize: "13px",
                      // 🎨 CUSTOMIZATION: Typography - Comment body (Default: gray-800)
                      color: theme === 'dark' ? "#E5E5E5" : "#1F2937",
                      // 🎨 CUSTOMIZATION: Spacing (Default: 13px)
                      marginBottom: "12px",
                      lineHeight: "1.625",
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
                  </p>
                )}

                {comment.gif && (
                  <img
                    src={comment.gif.gifUrl}
                    alt={comment.gif.altText}
                    style={{
                      width: gifAspectRatio > 1 ? 200 : 200 * gifAspectRatio,
                      height: gifAspectRatio < 1 ? 200 : 200 / gifAspectRatio,
                      borderRadius: "0.25rem",
                      overflow: "hidden",
                      objectFit: "cover",
                      // 🎨 CUSTOMIZATION: Spacing (Default: 13px)
                      marginBottom: "12px",
                    }}
                  />
                )}

                {isOwnRemoved && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: theme === 'dark' ? "#A3A3A3" : "#6B7280",
                      marginBottom: "12px",
                    }}
                  >
                    {ownRemovedLabel}
                  </p>
                )}

                {isOwnRemoved && replyErrorMessage && (
                  <p
                    role="alert"
                    style={{
                      fontSize: "13px",
                      color: theme === 'dark' ? "#A3A3A3" : "#6B7280",
                      marginBottom: "12px",
                    }}
                  >
                    {replyErrorMessage}
                  </p>
                )}

                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  {/* ⊖ on the line, level with the actions, when replies are
                      listed under the comment */}
                  {showReplies && line && (
                    <ThreadCollapseButton
                      line={line}
                      collapsed={false}
                      backgroundColor={circleBackgroundColor}
                      style={{
                        // The actions start after the avatar and its gap
                        insetInlineStart: circleInlineStart(AVATAR_SIZE + AVATAR_GAP),
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    />
                  )}
                  <ReplyButtonAndInfo
                    hasReplies={replyCount > 0}
                    replyCount={replyCount}
                    setShowReplyForm={setShowReplyForm}
                    canReply={!isOwnRemoved}
                  />
                  {/* Vote buttons inline with reply options */}
                  {!isOwnRemoved && (
                    <div style={{ flexShrink: 0 }}>
                      <VoteButtons
                        comment={comment}
                        size="small"
                        highlighted={isHighlighted}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          )}
        </div>
      </div>
    </div>

    {/* Reply form: lined up with the comment's content, and pulled up into
        the row's bottom padding so it sits right under the reply button */}
    {showForm && (
      <div
        style={{
          marginTop: `-${ROW_PADDING_Y}px`,
          marginInlineStart: `-${highlightReachStart}px`,
        marginInlineEnd: `-${SECTION_PADDING_X}px`,
          paddingInlineStart: `${highlightReachStart}px`,
          backgroundColor: highlightGutterColor,
        }}
      >
        <div
          style={{
            backgroundColor: highlightColor,
            paddingInlineEnd: `${SECTION_PADDING_X}px`,
          }}
        >
        <div
          style={{
            position: "relative",
            marginInlineStart: `${INDENT}px`,
            paddingInlineStart: `${AVATAR_SIZE + AVATAR_GAP - INDENT}px`,
            paddingBottom: `${ROW_PADDING_Y}px`,
          }}
        >
          <IndentationThreadingLines
            line={line}
            isLastReply={!showReplies}
            joinAt={REPLY_FORM_JOIN_Y}
            reach={AVATAR_SIZE + AVATAR_GAP - INDENT}
          />
          <NewReplyForm
            comment={comment}
            setShowReplyForm={setShowReplyForm}
            replyContent={replyContent}
            setReplyContent={setReplyContent}
            replyMentions={replyMentions}
            setReplyMentions={setReplyMentions}
            errorMessage={replyErrorMessage}
            onDismissError={() => {
              if (replyErrorMessage) setDismissedReplyError(createError ?? null);
            }}
          />
        </div>
        </div>
      </div>
    )}
    </>
  );
}

export default SingleComment;
