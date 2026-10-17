import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  useCommentSection,
  useUser,
  useUserMentions,
  useProject,
  handleError,
  type CommentCreateError,
} from "@sublay/react-js";
import useTextareaCursorIndicator from "~shared/react/use-textarea-cursor-indicator";
import GiphyContainer from "~shared/react/giphy-container";
import MentionSuggestions from "./mention-suggestions";
import { getCommentCreateErrorMessage } from "../utils/comment-create-error";
import { cn } from "@/lib/utils";
import strings from "../utils/strings";

function NewCommentForm({
  gifPickerFullScreen = false,
}: {
  // Where the GIF picker opens. false: it covers the comment section.
  // true: it covers the whole screen.
  gifPickerFullScreen?: boolean;
}) {
  const { user } = useUser();
  const { project } = useProject();
  const giphyApiKey = project?.integrations.find((int) => int.name === "giphy")
    ?.data.apiKey;

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGiphyVisible, setIsGiphyVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { createComment, callbacks, createError } = useCommentSection();

  // A failed post shows a message under the form, until the text is edited or
  // something is sent again (the section clears `createError` then). Replies
  // have their own form, which shows its own failures.
  const [dismissedCreateError, setDismissedCreateError] =
    useState<CommentCreateError | null>(null);
  const createErrorMessage =
    createError &&
    createError.parentId === null &&
    createError !== dismissedCreateError
      ? getCommentCreateErrorMessage(createError)
      : null;

  const hasContent = content.trim().length > 0;

  const { cursorPosition, isSelectionActive } = useTextareaCursorIndicator({
    textAreaRef,
  });

  const {
    isMentionActive,
    loading,
    mentionSuggestions,
    handleMentionClick,
    mentions,
    setMentions,
    resetMentions,
  } = useUserMentions({
    content: textAreaRef.current?.value || "",
    setContent: (value: string) => {
      if (textAreaRef.current) {
        textAreaRef.current.value = value;
        setContent(value);
      }
    },
    focus: () => textAreaRef.current?.focus(),
    cursorPosition,
    isSelectionActive,
  });

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      const textArea = textAreaRef.current;
      if (!textArea || isSubmitting) return;

      if (!hasContent) {
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

      const tempContent = textArea.value.trim();
      const tempMentions = mentions;

      // Clear optimistically before the API call
      textArea.value = "";
      setContent("");
      resetMentions();
      setIsExpanded(false);
      textArea.blur();
      setIsSubmitting(true);

      try {
        const result = await createComment?.({ content: tempContent, mentions: tempMentions });
        if (result === undefined) {
          // SDK handled the failure and removed the optimistic comment; restore textarea
          textArea.value = tempContent;
          setContent(tempContent);
          setMentions(tempMentions);
          setIsExpanded(true);
        }
      } catch (error) {
        console.error("Error creating comment:", error);
        textArea.value = tempContent;
        setContent(tempContent);
        setMentions(tempMentions);
        setIsExpanded(true);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      hasContent,
      isSubmitting,
      user,
      createComment,
      mentions,
      resetMentions,
      callbacks,
    ]
  );

  const handleCreateGif = useCallback(
    async (gif: {
      id: string;
      url: string;
      gifUrl: string;
      gifPreviewUrl: string;
      altText: string;
      aspectRatio: string;
    }) => {
      if (!user) {
        callbacks?.loginRequiredCallback?.();
        setIsGiphyVisible(false);
        return;
      }

      if (!user.username && callbacks?.usernameRequiredCallback) {
        callbacks.usernameRequiredCallback();
        setIsGiphyVisible(false);
        return;
      }

      const textArea = textAreaRef.current;
      if (!textArea) throw new Error("Can not find textarea");

      const tempContent = textArea.value;
      const tempMentions = mentions;

      textArea.value = "";
      setContent("");
      resetMentions();
      setIsGiphyVisible(false);
      setIsExpanded(false);

      try {
        const result = await createComment?.({ gif, mentions: tempMentions });
        if (result === undefined) {
          // Nothing was posted: put the text and mentions back
          textArea.value = tempContent;
          setContent(tempContent);
          setMentions(tempMentions);
          if (tempContent) setIsExpanded(true);
        }
      } catch (err) {
        handleError(err, "Creating comment failed: ");
        textArea.value = tempContent;
        setContent(tempContent);
        setMentions(tempMentions);
        if (tempContent) setIsExpanded(true);
      }
    },
    [createComment, mentions, resetMentions, setMentions, user, callbacks]
  );

  // Cancel clears the draft and folds the box back to one line
  const handleCancel = useCallback(() => {
    const textArea = textAreaRef.current;
    if (textArea) {
      textArea.value = "";
      textArea.blur();
    }
    setContent("");
    resetMentions();
    setIsExpanded(false);
  }, [resetMentions]);

  // While open, the box grows with its text (up to its max height); folded,
  // it goes back to its one-line height
  useEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea) return;
    textArea.style.height = "";
    if (isExpanded) {
      textArea.style.height = `${textArea.scrollHeight}px`;
    }
  }, [content, isExpanded]);

  // Add keyboard event handler for Enter key
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.ctrlKey && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
    };

    const textArea = textAreaRef.current;
    textArea?.addEventListener("keydown", handleKeyDown);

    return () => {
      textArea?.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSubmit]);

  return (
    <>
      {giphyApiKey ? (
        <GiphyContainer
          giphyApiKey={giphyApiKey}
          onClickBack={() => setIsGiphyVisible(false)}
          onSelectGif={(selected) => handleCreateGif(selected)}
          visible={isGiphyVisible}
          fullScreen={gifPickerFullScreen}
        />
      ) : null}
      <form onSubmit={handleSubmit} className="relative">
        {/* The form sits above the comments, so the suggestions open under it
            rather than over the content above */}
        <MentionSuggestions
          isMentionActive={isMentionActive}
          isLoadingMentions={loading}
          mentionSuggestions={mentionSuggestions}
          handleMentionClick={handleMentionClick}
          placement="below"
        />
        <div
          className={cn(
            // 🎨 CUSTOMIZATION: Comment form styling
            "rounded-[20px] border bg-transparent",
            "transition-colors duration-150",
            isExpanded
              ? "border-gray-400 dark:border-neutral-400"
              : "border-gray-200 dark:border-neutral-600 hover:border-gray-400 dark:hover:border-neutral-400"
          )}
        >
          <textarea
            ref={textAreaRef}
            // Typed text reads in its own direction; while empty, the
            // placeholder follows the page
            dir={content ? "auto" : undefined}
            // A thin one-line box until focused, then it opens with the
            // toolbar and grows with its text
            onFocus={() => setIsExpanded(true)}
            onChange={(e) => {
              setContent(e.target.value);
              if (createError) setDismissedCreateError(createError);
            }}
            // 🎨 CUSTOMIZATION: Comment form styling (Default placeholder)
            placeholder={strings.commentPlaceholder}
            aria-label={strings.commentPlaceholder}
            className={cn(
              // 🎨 CUSTOMIZATION: Comment form styling
              "block w-full px-4 py-2.5",
              "bg-transparent",
              "text-gray-900 dark:text-neutral-50",
              "placeholder:text-gray-500 dark:placeholder:text-neutral-400",
              "text-sm leading-5",
              "outline-none resize-none border-none",
              isExpanded ? "min-h-[4.5rem] max-h-[50vh]" : "h-10 overflow-hidden"
            )}
            rows={1}
          />
          {isExpanded && (
            <div className="flex items-center gap-2 px-2 pb-2">
              {giphyApiKey ? (
                <button
                  type="button"
                  onClick={() => setIsGiphyVisible(true)}
                  disabled={isSubmitting}
                  aria-label={strings.addGif}
                  className={cn(
                    // 🎨 CUSTOMIZATION: Comment form styling
                    "h-9 rounded-full px-3",
                    "text-xs font-bold text-gray-500 dark:text-neutral-400",
                    "transition-colors duration-150",
                    "hover:bg-gray-100 dark:hover:bg-neutral-700 hover:text-gray-900 dark:hover:text-neutral-50",
                    "disabled:opacity-50"
                  )}
                >
                  GIF
                </button>
              ) : null}
              <div className="ms-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className={cn(
                    // 🎨 CUSTOMIZATION: Cancel button styling
                    "h-9 rounded-full px-4",
                    "text-sm font-semibold text-gray-900 dark:text-neutral-50",
                    "bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600",
                    "transition-colors duration-150"
                  )}
                >
                  {strings.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!hasContent || isSubmitting}
                  className={cn(
                    // 🎨 CUSTOMIZATION: Submit button styling
                    "h-9 rounded-full px-4",
                    "text-sm font-semibold",
                    "bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500",
                    "transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
                  )}
                >
                  {strings.submitComment}
                </button>
              </div>
            </div>
          )}
        </div>
        {createErrorMessage && (
          <p
            role="alert"
            className="mt-1.5 px-2 text-[13px] text-gray-500 dark:text-neutral-400"
            // 🎨 CUSTOMIZATION: Failed-post message styling
          >
            {createErrorMessage}
          </p>
        )}
      </form>
    </>
  );
}

export default NewCommentForm;
