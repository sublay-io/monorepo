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
import useUIState from "../hooks/use-ui-state";

function NewCommentForm({
  gifPickerFullScreen = false,
}: {
  // Where the GIF picker opens. false: it covers the comment section.
  // true: it covers the whole screen.
  gifPickerFullScreen?: boolean;
}) {
  const { theme } = useUIState();
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
          theme={theme}
        />
      ) : null}
      <form onSubmit={handleSubmit} style={{ position: "relative" }}>
        <MentionSuggestions
          isMentionActive={isMentionActive}
          isLoadingMentions={loading}
          mentionSuggestions={mentionSuggestions}
          handleMentionClick={handleMentionClick}
        />
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            // 🎨 CUSTOMIZATION: Comment form styling (Default: white)
            backgroundColor: theme === 'dark' ? "#262626" : "#FFFFFF",
            borderRadius: "16px",
            border: `1px solid ${hasContent ? (theme === 'dark' ? "#1E40AF" : "#BFDBFE") : (theme === 'dark' ? "#525252" : "#E5E7EB")}`,
            boxShadow: hasContent
              ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
              : "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            transition: "all 300ms ease-in-out",
            // 🎨 CUSTOMIZATION: Comment form styling (Default: 8px)
            padding: "8px",
          }}
          onMouseEnter={(e) => {
            if (!hasContent) {
              e.currentTarget.style.boxShadow =
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
            }
          }}
          onMouseLeave={(e) => {
            if (!hasContent) {
              e.currentTarget.style.boxShadow =
                "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)";
            }
          }}
        >
          <textarea
            ref={textAreaRef}
            onChange={(e) => {
              setContent(e.target.value);
              if (createError) setDismissedCreateError(createError);
            }}
            // 🎨 CUSTOMIZATION: Comment form styling (Default placeholder)
            placeholder="Join the conversation"
            style={{
              flex: 1,
              // 🎨 CUSTOMIZATION: Comment form styling (Default: 8px)
              padding: "8px",
              // 🎨 CUSTOMIZATION: Comment form styling (Default: transparent)
              backgroundColor: "transparent",
              // 🎨 CUSTOMIZATION: Comment form styling (Default: gray-900)
              color: theme === 'dark' ? "#FAFAFA" : "#111827",
              // 🎨 CUSTOMIZATION: Comment form styling (Default: 14px)
              fontSize: "14px",
              lineHeight: "1.625",
              outline: "none",
              resize: "none",
              border: "none",
            }}
            rows={2}
          />
          {!hasContent && giphyApiKey ? (
            <button
              type="button"
              onClick={() => setIsGiphyVisible(true)}
              disabled={isSubmitting}
              style={{
                flexShrink: 0,
                // 🎨 CUSTOMIZATION: Comment form styling (Default: 8px)
                padding: "8px",
                border: "none",
                outline: "none",
                // 🎨 CUSTOMIZATION: Comment form styling (Default: regular)
                fontWeight: 400,
                // 🎨 CUSTOMIZATION: Comment form styling (Default: 13px)
                fontSize: "13px",
                // 🎨 CUSTOMIZATION: Comment form styling (Default: gray-500)
                color: theme === 'dark' ? "#FAFAFA" : "#6B7280",
                cursor: "pointer",
                backgroundColor: "transparent",
              }}
            >
              GIF
            </button>
          ) : (
            <button
              type="submit"
              disabled={!hasContent || isSubmitting}
              style={{
                flexShrink: 0,
                // 🎨 CUSTOMIZATION: Comment form styling (Default: 8px)
                padding: "8px",
                borderRadius: "50%",
                backgroundColor:
                  hasContent && !isSubmitting ? (theme === 'dark' ? "#2563EB" : "#2563EB") : (theme === 'dark' ? "#525252" : "#E5E7EB"),
                color: hasContent && !isSubmitting ? "#FFFFFF" : (theme === 'dark' ? "#737373" : "#9CA3AF"),
                boxShadow:
                  "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                transition: "all 200ms ease-in-out",
                border: "none",
                cursor: !hasContent || isSubmitting ? "not-allowed" : "pointer",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                if (hasContent && !isSubmitting) {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? "#3B82F6" : "#1D4ED8";
                  e.currentTarget.style.boxShadow =
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                }
              }}
              onMouseLeave={(e) => {
                if (hasContent && !isSubmitting) {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? "#2563EB" : "#2563EB";
                  e.currentTarget.style.boxShadow =
                    "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)";
                }
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
              <svg
                style={{
                  // 🎨 CUSTOMIZATION: Comment form styling (Default: 13px)
                  height: "12px",
                  width: "12px",
                  transition: "transform 200ms ease-in-out",
                  transform: hasContent ? "scale(1)" : "scale(1)",
                }}
                onMouseEnter={(e) => {
                  if (hasContent) {
                    e.currentTarget.style.transform = "scale(1.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasContent) {
                    e.currentTarget.style.transform = "scale(1)";
                  }
                }}
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
