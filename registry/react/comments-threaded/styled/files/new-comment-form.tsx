import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  useCommentSection,
  useUser,
  useUserMentions,
  handleError,
  type CommentCreateError,
} from "@sublay/react-js";
import useTextareaCursorIndicator from "~shared/react/use-textarea-cursor-indicator";
import GiphyContainer from "~shared/react/giphy-container";
import MentionSuggestions from "./mention-suggestions";
import { getCommentCreateErrorMessage } from "../utils/comment-create-error";
import useUIState from "../hooks/use-ui-state";
import strings from "../utils/strings";
import { GIPHY_API_KEY_NAME, giphyApiKey, isDevelopment } from "../utils/env";

function NewCommentForm() {
  const { user } = useUser();
  const { theme } = useUIState();

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

  // Without a key the GIF button shows only in development, and says what
  // to set instead of opening the picker
  const openGifPicker = () => {
    if (!giphyApiKey) {
      alert(
        `GIFs need a Giphy API key. Set ${GIPHY_API_KEY_NAME} in your environment, or change where it's read in this component's utils/env file.`
      );
      return;
    }
    setIsGiphyVisible(true);
  };

  return (
    <>
      {giphyApiKey ? (
        <GiphyContainer
          giphyApiKey={giphyApiKey}
          onClickBack={() => setIsGiphyVisible(false)}
          onSelectGif={(selected) => handleCreateGif(selected)}
          visible={isGiphyVisible}
          // Over the whole window: the section has no fixed height to cover
          fullScreen
          theme={theme}
        />
      ) : null}
      <form onSubmit={handleSubmit} style={{ position: "relative" }}>
        {/* The form sits above the comments, so the suggestions open under it
            rather than over the content above */}
        <MentionSuggestions
          placement="below"
          isMentionActive={isMentionActive}
          isLoadingMentions={loading}
          mentionSuggestions={mentionSuggestions}
          handleMentionClick={handleMentionClick}
        />
        <div
          style={{
            // 🎨 CUSTOMIZATION: Comment form styling
            borderRadius: "20px",
            border: `1px solid ${
              isExpanded
                ? (theme === 'dark' ? "#A3A3A3" : "#9CA3AF")
                : (theme === 'dark' ? "#525252" : "#E5E7EB")
            }`,
            backgroundColor: "transparent",
            transition: "border-color 150ms ease-in-out",
          }}
          onMouseEnter={(e) => {
            if (!isExpanded) {
              e.currentTarget.style.borderColor = theme === 'dark' ? "#A3A3A3" : "#9CA3AF";
            }
          }}
          onMouseLeave={(e) => {
            if (!isExpanded) {
              e.currentTarget.style.borderColor = theme === 'dark' ? "#525252" : "#E5E7EB";
            }
          }}
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
            // A thin one-line box until focused, then it opens with the
            // toolbar and grows with its text
            onFocus={() => setIsExpanded(true)}
            // 🎨 CUSTOMIZATION: Comment form styling (Default placeholder)
            placeholder={strings.commentPlaceholder}
            aria-label={strings.commentPlaceholder}
            style={{
              display: "block",
              width: "100%",
              boxSizing: "border-box",
              // 🎨 CUSTOMIZATION: Comment form styling
              padding: "10px 16px",
              backgroundColor: "transparent",
              color: theme === 'dark' ? "#FAFAFA" : "#111827",
              fontSize: "14px",
              lineHeight: "20px",
              outline: "none",
              resize: "none",
              border: "none",
              ...(isExpanded
                ? { minHeight: "4.5rem", maxHeight: "50vh" }
                : { height: "40px", overflow: "hidden" }),
            }}
            rows={1}
          />
          {isExpanded && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "0 8px 8px",
              }}
            >
              {giphyApiKey || isDevelopment ? (
                <button
                  type="button"
                  onClick={openGifPicker}
                  disabled={isSubmitting}
                  aria-label={strings.addGif}
                  style={{
                    // 🎨 CUSTOMIZATION: Comment form styling
                    height: "36px",
                    borderRadius: "9999px",
                    padding: "0 12px",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: theme === 'dark' ? "#A3A3A3" : "#6B7280",
                    backgroundColor: "transparent",
                    cursor: isSubmitting ? "default" : "pointer",
                    opacity: isSubmitting ? 0.5 : 1,
                    transition: "background-color 150ms ease-in-out, color 150ms ease-in-out",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme === 'dark' ? "#404040" : "#F3F4F6";
                    e.currentTarget.style.color = theme === 'dark' ? "#FAFAFA" : "#111827";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = theme === 'dark' ? "#A3A3A3" : "#6B7280";
                  }}
                >
                  GIF
                </button>
              ) : null}
              <div
                style={{
                  marginInlineStart: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    // 🎨 CUSTOMIZATION: Cancel button styling
                    height: "36px",
                    borderRadius: "9999px",
                    padding: "0 16px",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: theme === 'dark' ? "#FAFAFA" : "#111827",
                    backgroundColor: theme === 'dark' ? "#404040" : "#F3F4F6",
                    cursor: "pointer",
                    transition: "background-color 150ms ease-in-out",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme === 'dark' ? "#525252" : "#E5E7EB";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme === 'dark' ? "#404040" : "#F3F4F6";
                  }}
                >
                  {strings.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!hasContent || isSubmitting}
                  style={{
                    // 🎨 CUSTOMIZATION: Submit button styling
                    height: "36px",
                    borderRadius: "9999px",
                    padding: "0 16px",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#FFFFFF",
                    backgroundColor: "#2563EB",
                    opacity: !hasContent || isSubmitting ? 0.5 : 1,
                    cursor: !hasContent || isSubmitting ? "not-allowed" : "pointer",
                    outline: "none",
                    transition: "background-color 150ms ease-in-out",
                  }}
                  onMouseEnter={(e) => {
                    if (hasContent && !isSubmitting) {
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? "#3B82F6" : "#1D4ED8";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#2563EB";
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = theme === 'dark' ? "2px solid #60A5FA" : "2px solid #3B82F6";
                    e.currentTarget.style.outlineOffset = "2px";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = "none";
                    e.currentTarget.style.outlineOffset = "0";
                  }}
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
            style={{
              // 🎨 CUSTOMIZATION: Failed-post message styling
              margin: "6px 0 0",
              padding: "0 8px",
              fontSize: "13px",
              color: theme === 'dark' ? "#A3A3A3" : "#6B7280",
            }}
          >
            {createErrorMessage}
          </p>
        )}
      </form>
    </>
  );
}

export default NewCommentForm;
