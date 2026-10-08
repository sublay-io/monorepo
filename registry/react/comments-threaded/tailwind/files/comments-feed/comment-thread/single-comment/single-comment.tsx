import { useState } from "react";
import {
  Comment as CommentType,
  UserMention,
  getUserName,
  useCommentSection,
  useReactionToggle,
  useUser,
} from "@sublay/react-js";
import {
  parseContentWithMentions,
  UserAvatar,
} from "@sublay/ui-core-react-js";
import VoteButtons from "./vote-buttons";
import ActionMenu from "../action-menu";
import NewReplyForm from "../new-reply-form";
import ToggleRepliesVisibilty from "./toggle-replies-visibility";
import IndentationThreadingLines from "./indentation-threading-lines";
import ReplyButtonAndInfo from "./reply-button-and-info";
import { cn } from "@/lib/utils";

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
      className="text-xs not-italic font-medium text-gray-500 dark:text-gray-400 px-2 py-1 -ml-2 rounded bg-transparent border-none cursor-pointer hover:text-blue-600 dark:hover:text-blue-500"
    >
      Remove your vote
    </button>
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
  const [comment] = useState(commentFromSection);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showBlockedComment, setShowBlockedComment] = useState(false);

  // isUnavailable wins over every other marker (the author blocked the
  // viewer): a neutral row, no reply/react. A comment by someone the viewer
  // blocked starts collapsed, and can be shown (then replied to / reacted to).
  const isUnavailable = !!comment.isUnavailable;
  const isBlockedCollapsed =
    !isUnavailable && !!comment.isAuthorBlocked && !showBlockedComment;
  const isPlaceholderRow = isUnavailable || isBlockedCollapsed;

  const maxDepth = 6; // Limit visual nesting depth
  const actualDepth = Math.min(depth, maxDepth);

  // Calculate progressive indentation using inline styles for reliability
  const indentationPx = actualDepth * 24; // 24px per level

  // The API sends aspectRatio as a string (e.g. "1.5"), so coerce before doing
  // math with it. Falls back to 1 (square) if it's missing or unparsable.
  const gifAspectRatio = Number(comment.gif?.aspectRatio) || 1;

  return (
    <div
      className={cn(
        "relative",
        highlightedComment?.comment.id === comment.id &&
          "bg-blue-100 dark:bg-blue-900"
      )}
      style={{
        // 🎨 CUSTOMIZATION: Progressive indentation (dynamic)
        marginLeft: `${indentationPx}px`,
      }}
    >
      {/* Threading lines - positioned behind avatars, relative to indentation */}
      {actualDepth > 0 && (
        <IndentationThreadingLines isLastReply={isLastReply} />
      )}

      <div
        className="py-2 rounded-md transition-colors duration-150"
        // 🎨 CUSTOMIZATION: Spacing
      >
        <div className="flex">
          {/* Avatar positioned for threading line connection with top margin */}
          <div
            className="flex-shrink-0 mr-3 relative mt-1"
            // 🎨 CUSTOMIZATION: Spacing
          >
            {isPlaceholderRow ? (
              <div className="relative z-10 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
            ) : (
              <div
                className="relative z-10 cursor-pointer"
                onClick={() => {
                  if (user?.id === comment.user?.id) {
                    callbacks?.currentUserClickCallback?.();
                  } else {
                    callbacks?.otherUserClickCallback?.(comment.user?.id ?? "", comment.user?.foreignId);
                  }
                }}
              >
                <UserAvatar
                  user={comment.user ?? {}}
                  // 🎨 CUSTOMIZATION: Avatar styling (Default: 24px)
                  borderRadius={24}
                  size={24}
                />
              </div>
            )}
            {/* Vertical line extending down from this comment's avatar when it has replies */}
            {hasReplies && !isCollapsed && (
              <div
                className="absolute w-px bg-gray-300 dark:bg-gray-500 z-0"
                style={{
                  // 🎨 CUSTOMIZATION: Threading line position
                  left: "50%",
                  top: "20px",
                  height: "calc(100% + 10px)",
                }}
              ></div>
            )}
          </div>

          {/* Comment content area */}
          {isPlaceholderRow ? (
            <div className="flex-1 min-w-0 flex items-center gap-2 min-h-7 text-xs italic text-gray-500 dark:text-gray-400">
              {isUnavailable ? (
                <>
                  <span>This comment is unavailable</span>
                  <RemoveOwnReactionButton comment={comment} />
                </>
              ) : (
                <>
                  <span>Comment from a user you blocked</span>
                  <button
                    onClick={() => setShowBlockedComment(true)}
                    className="text-xs not-italic font-medium text-blue-600 dark:text-blue-400 bg-transparent border-none p-0 cursor-pointer hover:underline"
                  >
                    Show anyway
                  </button>
                </>
              )}
              {hasReplies && (
                <ToggleRepliesVisibilty
                  isCollapsed={isCollapsed}
                  onToggleCollapse={onToggleCollapse}
                />
              )}
            </div>
          ) : (
          <div className="flex-1 min-w-0">
            <div
              className="flex items-center justify-between mb-1"
              // 🎨 CUSTOMIZATION: Spacing
            >
              <div
                className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
                // 🎨 CUSTOMIZATION: Typography and spacing
              >
                <span
                  className="font-medium text-xs text-gray-700 dark:text-gray-300 cursor-pointer hover:underline"
                  // 🎨 CUSTOMIZATION: Author name styling
                  onClick={() => {
                    if (user?.id === comment.user?.id) {
                      callbacks?.currentUserClickCallback?.();
                    } else {
                      callbacks?.otherUserClickCallback?.(comment.user?.id ?? "", comment.user?.foreignId);
                    }
                  }}
                >
                  {getUserName(comment.user ?? {})}
                </span>
                <span className="text-gray-500 dark:text-gray-400">•</span>
                <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                {isCollapsed && hasReplies && (
                  <span className="text-blue-500 dark:text-blue-400 text-xs">
                    ({replyCount} {replyCount === 1 ? "reply" : "replies"})
                  </span>
                )}
                {hasReplies && (
                  <ToggleRepliesVisibilty
                    isCollapsed={isCollapsed}
                    onToggleCollapse={onToggleCollapse}
                  />
                )}
              </div>
              <ActionMenu comment={comment} />
            </div>

            {!isCollapsed && (
              <>
                {comment.content && (
                  <p
                    className="text-xs text-gray-800 dark:text-gray-200 mb-3 leading-relaxed"
                    // 🎨 CUSTOMIZATION: Comment body typography
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

                {comment.gif && (
                  <img
                    src={comment.gif.gifUrl}
                    alt={comment.gif.altText}
                    className="rounded overflow-hidden object-cover mb-3"
                    style={{
                      // 🎨 CUSTOMIZATION: GIF dimensions (dynamic based on aspect ratio)
                      width: gifAspectRatio > 1 ? 200 : 200 * gifAspectRatio,
                      height: gifAspectRatio < 1 ? 200 : 200 / gifAspectRatio,
                    }}
                  />
                )}

                <div
                  className="flex items-center justify-between"
                  // 🎨 CUSTOMIZATION: Actions layout
                >
                  <ReplyButtonAndInfo
                    hasReplies={replyCount > 0}
                    replyCount={replyCount}
                    setShowReplyForm={setShowReplyForm}
                  />
                  {/* Vote buttons inline with reply options */}
                  <div className="flex-shrink-0">
                    <VoteButtons
                      comment={comment}
                      size="small"
                    />
                  </div>
                </div>

                {/* Reply form */}
                {showReplyForm && (
                  <NewReplyForm
                    comment={comment}
                    setShowReplyForm={setShowReplyForm}
                  />
                )}
              </>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SingleComment;
