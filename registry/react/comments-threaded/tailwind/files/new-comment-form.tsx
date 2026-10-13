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
      setIsSubmitting(true);

      try {
        const result = await createComment?.({ content: tempContent, mentions: tempMentions });
        if (result === undefined) {
          // SDK handled the failure and removed the optimistic comment; restore textarea
          textArea.value = tempContent;
          setContent(tempContent);
          setMentions(tempMentions);
        }
      } catch (error) {
        console.error("Error creating comment:", error);
        textArea.value = tempContent;
        setContent(tempContent);
        setMentions(tempMentions);
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

      try {
        const result = await createComment?.({ gif, mentions: tempMentions });
        if (result === undefined) {
          // Nothing was posted: put the text and mentions back
          textArea.value = tempContent;
          setContent(tempContent);
          setMentions(tempMentions);
        }
      } catch (err) {
        handleError(err, "Creating comment failed: ");
        textArea.value = tempContent;
        setContent(tempContent);
        setMentions(tempMentions);
      }
    },
    [createComment, mentions, resetMentions, setMentions, user, callbacks]
  );

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
        <MentionSuggestions
          isMentionActive={isMentionActive}
          isLoadingMentions={loading}
          mentionSuggestions={mentionSuggestions}
          handleMentionClick={handleMentionClick}
        />
        <div
          className={cn(
            // 🎨 CUSTOMIZATION: Comment form styling
            "flex items-end",
            "bg-white dark:bg-neutral-800",
            "rounded-2xl",
            "p-2",
            "transition-all duration-300",
            "shadow-sm",
            hasContent
              ? "border border-blue-300 dark:border-blue-800 shadow-md"
              : "border border-gray-200 dark:border-neutral-600 hover:shadow-md"
          )}
        >
          <textarea
            ref={textAreaRef}
            // Typed text reads in its own direction; while empty, the
            // placeholder follows the page
            dir={content ? "auto" : undefined}
            onChange={(e) => {
              setContent(e.target.value);
              if (createError) setDismissedCreateError(createError);
            }}
            // 🎨 CUSTOMIZATION: Comment form styling (Default placeholder)
            placeholder={strings.commentPlaceholder}
            className={cn(
              // 🎨 CUSTOMIZATION: Comment form styling
              "flex-1 p-2",
              "bg-transparent",
              "text-gray-900 dark:text-neutral-50",
              "text-sm leading-relaxed",
              "outline-none resize-none border-none"
            )}
            rows={2}
          />
          {!hasContent && giphyApiKey ? (
            <button
              type="button"
              onClick={() => setIsGiphyVisible(true)}
              disabled={isSubmitting}
              className={cn(
                // 🎨 CUSTOMIZATION: Comment form styling
                "flex-shrink-0 p-2",
                "border-none outline-none",
                "font-normal text-[13px]",
                "text-gray-500 dark:text-neutral-50",
                "cursor-pointer bg-transparent"
              )}
            >
              GIF
            </button>
          ) : (
            <button
              type="submit"
              disabled={!hasContent || isSubmitting}
              className={cn(
                // 🎨 CUSTOMIZATION: Comment form styling
                "flex-shrink-0 p-2",
                "rounded-full",
                "shadow-sm",
                "transition-all duration-200",
                "border-none outline-none",
                "focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                hasContent && !isSubmitting
                  ? "bg-blue-600 dark:bg-blue-600 text-white cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-500 hover:shadow-md"
                  : "bg-gray-200 dark:bg-neutral-600 text-gray-400 dark:text-neutral-500 cursor-not-allowed"
              )}
            >
              <svg
                className={cn(
                  // 🎨 CUSTOMIZATION: Comment form styling
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
