import { useEffect, useRef, useState } from "react";
import {
  useCommentSection,
  useUser,
  useUserMentions,
  Comment as CommentType,
  type Mention,
} from "@sublay/react-js";
import useTextareaCursorIndicator from "~shared/react/use-textarea-cursor-indicator";
import MentionSuggestions from "../../mention-suggestions";
import { cn } from "@/lib/utils";

function NewReplyForm({
  comment,
  setShowReplyForm,
  replyContent,
  setReplyContent,
  errorMessage,
  onDismissError,
  replyMentions,
  setReplyMentions,
}: {
  comment: CommentType;
  setShowReplyForm: React.Dispatch<React.SetStateAction<boolean>>;
  // The text lives in the comment row: the form closes while a reply is being
  // sent, and comes back with the text if sending fails.
  replyContent: string;
  setReplyContent: React.Dispatch<React.SetStateAction<string>>;
  // The users mentioned in the text, kept in the comment row with it.
  replyMentions: Mention[];
  setReplyMentions: React.Dispatch<React.SetStateAction<Mention[]>>;
  /** Why the last reply to this comment wasn't posted, if it wasn't. */
  errorMessage: string | null;
  onDismissError: () => void;
}) {
  const { user } = useUser();

  const { createComment, callbacks } = useCommentSection();

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { cursorPosition, isSelectionActive } = useTextareaCursorIndicator({
    textAreaRef,
  });

  // Mentions are only added by picking a suggestion after typing "@": the
  // author being replied to is not mentioned automatically.
  const {
    isMentionActive,
    loading,
    mentionSuggestions,
    handleMentionClick,
    mentions,
    setMentions,
    resetMentions,
  } = useUserMentions({
    content: replyContent,
    setContent: (value: string) => {
      if (textAreaRef.current) {
        textAreaRef.current.value = value;
        setReplyContent(value);
      }
    },
    focus: () => textAreaRef.current?.focus(),
    cursorPosition,
    isSelectionActive,
  });

  // The form is unmounted whenever it closes, so the mentions are kept in the
  // comment row next to the text: taken from there when the form opens, and
  // written back as they change.
  const [mentionsLoaded, setMentionsLoaded] = useState(false);
  useEffect(() => {
    setMentions(replyMentions);
    setMentionsLoaded(true);
    // Only when the form opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (mentionsLoaded) setReplyMentions(mentions);
  }, [mentionsLoaded, mentions, setReplyMentions]);

  const handleReply = async () => {
    if (!replyContent.trim()) {
      callbacks?.commentTooShortCallback?.();
      return;
    }

    if (!user) {
      callbacks?.loginRequiredCallback();
      return;
    }

    if (!user.username && callbacks?.usernameRequiredCallback) {
      callbacks.usernameRequiredCallback();
      return;
    }

    const tempContent = replyContent.trim();
    const tempMentions = mentions;

    // Clear optimistically before the API call
    setReplyContent("");
    resetMentions();
    setReplyMentions([]);
    setShowReplyForm(false);

    try {
      const result = await createComment?.({
        content: tempContent,
        parentId: comment.id,
        mentions: tempMentions,
      });
      if (result === undefined) {
        // SDK handled the failure and removed the optimistic comment; restore form
        setReplyContent(tempContent);
        setReplyMentions(tempMentions);
        setShowReplyForm(true);
      }
    } catch (error) {
      console.error("Error creating reply:", error);
      setReplyContent(tempContent);
      setReplyMentions(tempMentions);
      setShowReplyForm(true);
    }
  };

  const handleCancelReply = () => {
    setShowReplyForm(false);
    setReplyContent("");
    resetMentions();
    setReplyMentions([]);
    onDismissError();
  };

  const hasContent = replyContent.trim().length > 0;

  return (
    <div
      className="mt-2"
      // 🎨 CUSTOMIZATION: Reply form spacing
    >
      {/* The suggestions open under the box, so they don't cover the comment
          being replied to */}
      <div className="relative">
        <MentionSuggestions
          isMentionActive={isMentionActive}
          isLoadingMentions={loading}
          mentionSuggestions={mentionSuggestions}
          handleMentionClick={handleMentionClick}
          placement="below"
        />
      <div
        className={cn(
          // 🎨 CUSTOMIZATION: Reply form styling
          "flex items-end",
          "bg-white dark:bg-neutral-800",
          "rounded-2xl",
          "p-1.5",
          "transition-all duration-300",
          "shadow-sm",
          hasContent
            ? "border border-blue-300 dark:border-blue-800 shadow-md"
            : "border border-gray-200 dark:border-neutral-600 hover:shadow-md"
        )}
      >
        <textarea
          ref={textAreaRef}
          // Not a controlled input: the cursor tracking that drives the
          // mention suggestions re-renders on every keystroke, which would
          // put the previous value back before onChange has read the new one
          defaultValue={replyContent}
          // Enter posts the reply; Shift+Enter adds a line break, as in the
          // main input
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey) {
              e.preventDefault();
              handleReply();
            }
          }}
          onChange={(e) => {
            setReplyContent(e.target.value);
            onDismissError();
          }}
          // 🎨 CUSTOMIZATION: Reply form placeholder
          placeholder="Add your reply..."
          className={cn(
            // 🎨 CUSTOMIZATION: Reply form textarea styling
            "flex-1 py-1.5 px-2",
            "bg-transparent",
            "text-gray-900 dark:text-neutral-50",
            "text-sm leading-relaxed",
            "outline-none resize-none border-none"
          )}
          rows={2}
        />
        <div className="flex gap-1 ml-1">
          <button
            onClick={handleCancelReply}
            className={cn(
              // 🎨 CUSTOMIZATION: Cancel button styling
              "px-2 py-1",
              "text-[13px]",
              "text-gray-600 dark:text-neutral-400",
              "rounded",
              "transition-colors duration-150",
              "bg-transparent border-none cursor-pointer",
              "hover:text-gray-800 dark:hover:text-neutral-200",
              "hover:bg-gray-50 dark:hover:bg-neutral-700"
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleReply}
            disabled={!hasContent}
            className={cn(
              // 🎨 CUSTOMIZATION: Submit button styling
              "flex-shrink-0 p-1.5",
              "rounded-full",
              "shadow-sm",
              "transition-all duration-200",
              "border-none outline-none",
              "focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-500 focus-visible:ring-offset-2",
              hasContent
                ? "bg-blue-600 dark:bg-blue-600 text-white cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-500 hover:shadow-md"
                : "bg-gray-200 dark:bg-neutral-600 text-gray-400 dark:text-neutral-500 cursor-not-allowed"
            )}
          >
            <svg
              className={cn(
                // 🎨 CUSTOMIZATION: Submit icon styling
                "h-3 w-3",
                "transition-transform duration-200",
                hasContent && "hover:scale-110"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
        </div>
      </div>
      </div>
      {errorMessage && (
        <p
          role="alert"
          className="mt-1.5 px-2 text-[13px] text-gray-500 dark:text-neutral-400"
          // 🎨 CUSTOMIZATION: Failed-reply message styling
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export default NewReplyForm;
