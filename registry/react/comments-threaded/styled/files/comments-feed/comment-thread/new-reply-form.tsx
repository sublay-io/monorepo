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
import useUIState from "../../../hooks/use-ui-state";
import strings from "../../../utils/strings";

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
  const { theme } = useUIState();
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

  return (
    <div
      style={{
        // 🎨 CUSTOMIZATION: Reply form styling (Default: 8px)
        marginTop: "8px",
      }}
    >
      {/* The suggestions open under the box, so they don't cover the comment
          being replied to */}
      <div style={{ position: "relative" }}>
        <MentionSuggestions
          isMentionActive={isMentionActive}
          isLoadingMentions={loading}
          mentionSuggestions={mentionSuggestions}
          handleMentionClick={handleMentionClick}
          placement="below"
        />
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          // 🎨 CUSTOMIZATION: Reply form styling (Default: white)
          backgroundColor: theme === 'dark' ? "#262626" : "#FFFFFF",
          borderRadius: "16px",
          border: `1px solid ${
            replyContent.trim().length > 0 ? (theme === 'dark' ? "#1E40AF" : "#BFDBFE") : (theme === 'dark' ? "#525252" : "#E5E7EB")
          }`,
          boxShadow:
            replyContent.trim().length > 0
              ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
              : "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          transition: "all 300ms ease-in-out",
          // 🎨 CUSTOMIZATION: Reply form styling (Default: 6px, derived from 8-2)
          padding: "6px",
        }}
        onMouseEnter={(e) => {
          if (replyContent.trim().length === 0) {
            e.currentTarget.style.boxShadow =
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
          }
        }}
        onMouseLeave={(e) => {
          if (replyContent.trim().length === 0) {
            e.currentTarget.style.boxShadow =
              "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)";
          }
        }}
      >
        <textarea
          ref={textAreaRef}
          // Typed text reads in its own direction; while empty, the
          // placeholder follows the page
          dir={replyContent ? "auto" : undefined}
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
          // 🎨 CUSTOMIZATION: Reply form styling (Default placeholder)
          placeholder={strings.replyPlaceholder}
          style={{
            flex: 1,
            // 🎨 CUSTOMIZATION: Reply form styling (Default: 6px 8px, derived from verticalPadding)
            padding: "6px 8px",
            // 🎨 CUSTOMIZATION: Reply form styling (Default: transparent)
            backgroundColor: "transparent",
            // 🎨 CUSTOMIZATION: Reply form styling (Default: gray-900)
            color: theme === 'dark' ? "#FAFAFA" : "#111827",
            // 🎨 CUSTOMIZATION: Reply form styling (Default: 14px)
            fontSize: "14px",
            lineHeight: "1.625",
            outline: "none",
            resize: "none",
            border: "none",
          }}
          rows={2}
        />
        <div
          style={{
            display: "flex",
            gap: "4px",
            marginInlineStart: "4px",
          }}
        >
          <button
            onClick={handleCancelReply}
            style={{
              padding: "4px 8px",
              // 🎨 CUSTOMIZATION: Reply form styling (Default: 13px)
              fontSize: "13px",
              color: theme === 'dark' ? "#A3A3A3" : "#4B5563",
              borderRadius: "4px",
              transition:
                "color 150ms ease-in-out, background-color 150ms ease-in-out, border-color 150ms ease-in-out",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme === 'dark' ? "#E5E5E5" : "#1F2937";
              e.currentTarget.style.backgroundColor = theme === 'dark' ? "#404040" : "#F3F4F6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme === 'dark' ? "#A3A3A3" : "#4B5563";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {strings.cancel}
          </button>
          <button
            onClick={handleReply}
            disabled={!replyContent.trim()}
            style={{
              flexShrink: 0,
              // 🎨 CUSTOMIZATION: Reply form styling (Default: 6px, derived from 8-2)
              padding: "6px",
              borderRadius: "50%",
              backgroundColor:
                replyContent.trim().length > 0
                  ? (theme === 'dark' ? "#2563EB" : "#2563EB")
                  : (theme === 'dark' ? "#525252" : "#E5E7EB"),
              color:
                replyContent.trim().length > 0
                  ? "#FFFFFF"
                  : (theme === 'dark' ? "#737373" : "#9CA3AF"),
              boxShadow:
                "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
              transition: "all 200ms ease-in-out",
              border: "none",
              cursor: !replyContent.trim() ? "not-allowed" : "pointer",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              if (replyContent.trim().length > 0) {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? "#3B82F6" : "#1D4ED8";
                e.currentTarget.style.boxShadow =
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
              }
            }}
            onMouseLeave={(e) => {
              if (replyContent.trim().length > 0) {
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
                // 🎨 CUSTOMIZATION: Reply form styling (Default: 13px)
                height: "12px",
                width: "12px",
                transition: "transform 200ms ease-in-out",
                transform: "scale(1)",
              }}
              onMouseEnter={(e) => {
                if (replyContent.trim().length > 0) {
                  e.currentTarget.style.transform = "scale(1.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (replyContent.trim().length > 0) {
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
        </div>
      </div>
      </div>
      {errorMessage && (
        <p
          role="alert"
          style={{
            // 🎨 CUSTOMIZATION: Failed-reply message styling
            margin: "6px 0 0",
            padding: "0 8px",
            fontSize: "13px",
            color: theme === 'dark' ? "#A3A3A3" : "#6B7280",
          }}
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export default NewReplyForm;
