import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  useCommentSection,
  handleError,
  useUserMentions,
  useUser,
  useProject,
  type CommentCreateError,
} from "@sublay/react-js";
import { resetButton, resetDiv, resetTextInput } from "~shared/react/reset-styles";
import UserAvatar from "~shared/react/user-avatar";
import GiphyContainer from "~shared/react/giphy-container";
import EmojiSuggestions from "~shared/react/emoji-suggestions";
import useTextareaCursorIndicator from "~shared/react/use-textarea-cursor-indicator";

import ReplyBanner from "./reply-banner";
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
  const { user } = useUser();
  const { project } = useProject();
  const giphyApiKey = project?.integrations.find((int) => int.name === "giphy")
    ?.data.apiKey;

  const { pushMention, createComment, submittingComment, callbacks, createError } =
    useCommentSection();

  // A failed post (a comment or a reply: both are sent from this form) shows
  // a message under the input, until the text is edited or something is sent
  // again (the section clears `createError` then).
  const [dismissedCreateError, setDismissedCreateError] =
    useState<CommentCreateError | null>(null);
  const createErrorMessage =
    createError && createError !== dismissedCreateError
      ? getCommentCreateErrorMessage(createError)
      : null;
  const { theme } = useUIState();

  const [isGiphyVisible, setIsGiphyVisible] = useState(false);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(""); // We've managed everything via the ref, but we need this to know if we render a post button or a show gifs button

  const { cursorPosition, isSelectionActive } = useTextareaCursorIndicator({
    textAreaRef,
  });

  const {
    isMentionActive,
    loading,
    mentionSuggestions,
    handleMentionClick,
    mentions,
    addMention,
    setMentions,
    resetMentions,
  } = useUserMentions({
    content: textAreaRef.current?.value || "",
    setContent: (value: string) => {
      if (textAreaRef.current) textAreaRef.current.value = value;
    },
    focus: () => textAreaRef.current?.focus(),
    cursorPosition,
    isSelectionActive,
  });

  const handleCreateComment = useCallback(async () => {
    const textArea = textAreaRef.current;
    if (!textArea) throw new Error("Can not find textarea");

    if (textArea.value.trim().length === 0) {
      callbacks?.commentTooShortCallback?.();
      return;
    }

    // Even though createComment checks for user and triggers the loginRequiredCallback - we will regard it as backup and check here too before clearing the textarea for better UX
    if (!user) {
      callbacks?.loginRequiredCallback?.();
      return;
    }

    if (!user.username && callbacks?.usernameRequiredCallback) {
      callbacks.usernameRequiredCallback();
      return;
    }

    const tempContent = textArea.value;
    const tempMentions = mentions;

    // Clear optimistically before the API call
    textArea.value = "";
    setContent("");
    resetMentions();

    try {
      const result = await createComment!({ content: tempContent, mentions: tempMentions });
      if (result === undefined) {
        // SDK handled the failure and removed the optimistic comment; restore textarea
        textArea.value = tempContent;
        setContent(tempContent);
        setMentions(tempMentions);
      }
    } catch (err) {
      textArea.value = tempContent;
      setContent(tempContent);
      setMentions(tempMentions);
      handleError(err, "Creating comment failed: ");
    }
  }, [createComment, mentions, resetMentions, callbacks, user]);

  const handleCreateGif = useCallback(
    async (gif: {
      id: string;
      url: string;
      gifUrl: string;
      gifPreviewUrl: string;
      altText: string;
      aspectRatio: string;
    }) => {
      // Even though createComment checks for user and triggers the loginRequiredCallback - we will regard it as backup and check here too before clearing the textarea for better UX
      if (!user) {
        callbacks?.loginRequiredCallback?.();
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
    [createComment, mentions, resetMentions, setMentions, callbacks, user]
  );

  useEffect(() => {
    if (!pushMention) return;
    const textArea = textAreaRef.current;
    if (!textArea) throw new Error("Can't find textarea");

    if (!pushMention.username) {
      callbacks?.userCantBeMentionedCallback?.();
      return;
    }

    addMention(pushMention);

    textArea.value = `@${pushMention.username} ${textArea.value}`;
  }, [pushMention]);

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.ctrlKey && !event.shiftKey) {
        event.preventDefault(); // Prevent the default Enter behavior
        handleCreateComment();
      }
      // For Ctrl+Enter or Shift+Enter, do nothing and let the event propagate
    };

    const textArea = textAreaRef.current;
    textArea?.addEventListener("keydown", handleKeyDown);

    return () => {
      textArea?.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleCreateComment]);

  const adjustTextareaHeight = () => {
    const textArea = textAreaRef.current;
    if (textArea) {
      textArea.style.height = "auto"; // Reset the height to 'auto' to get the correct scrollHeight
      const baseHeight = 20; // Example base height in pixels. Adjust this value to match your design.
      textArea.style.height = `${Math.max(
        baseHeight,
        Math.min(100, textArea.scrollHeight)
      )}px`; // Set the new height based on the content or use the base height if smaller
    }
  };

  useLayoutEffect(() => {
    const timeout = setTimeout(() => adjustTextareaHeight(), 500);
    return () => clearTimeout(timeout); // Proper cleanup to clear the timeout
  }, []);

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
      <div
        style={{
          ...resetDiv,
          position: "relative",
          // 🎨 CUSTOMIZATION: Form background color (Default: white)
          backgroundColor: theme === 'dark' ? '#262626' : '#fff',
        }}
      >
        <div style={{ width: "100%", position: "relative" }}>
          <ReplyBanner />
          <MentionSuggestions
            isMentionActive={isMentionActive}
            isLoadingMentions={loading}
            mentionSuggestions={mentionSuggestions}
            handleMentionClick={handleMentionClick}
          />
        </div>
        <div style={{ position: "relative", zIndex: 20, backgroundColor: theme === 'dark' ? '#262626' : '#fff' }}>
          {/* 🔧 CUSTOMIZE: Remove this component if you don't want emoji picker */}
          <EmojiSuggestions
            onEmojiClick={(emoji) => {
              const textArea = textAreaRef.current;
              if (!textArea) throw new Error("Can't find textarea");
              textArea.value += emoji;
              setContent((c) => c + emoji);
            }}
            theme={theme}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              // 🎨 CUSTOMIZATION: Form spacing (Default: 8px gap, 8px vertical padding)
              gap: 8,
              paddingTop: 8,
              paddingBottom: 8,
              paddingInlineStart: 8,
              paddingInlineEnd: 16,
            }}
          >
            {/* 🎨 CUSTOMIZATION: Form layout (Default: true - show avatar, 32px size) */}
            {user && true ? (
              <UserAvatar
theme={theme}
                user={user}
                size={32}
                borderRadius={32}
              />
            ) : (
              <div style={{ height: 32, width: 2 }} />
            )}
            <textarea
              id="sublay-social-textarea"
              rows={1}
              ref={textAreaRef}
              // Typed text reads in its own direction; while empty, the
              // placeholder follows the page
              dir={content ? "auto" : undefined}
              placeholder="Add a comment..."
              onChange={(e) => {
                setContent(e.target.value);
                if (createError) setDismissedCreateError(createError);
              }}
              required
              style={{
                ...resetTextInput,
                width: "100%",
                // 🎨 CUSTOMIZATION: Textarea styling
                fontSize: 14,
                color: theme === 'dark' ? '#E5E5E5' : '#000',
                backgroundColor: theme === 'dark' ? '#262626' : '#fff',
              }}
            />
            {content.length === 0 && giphyApiKey ? (
              <button
                type="button"
                onClick={() => setIsGiphyVisible(true)}
                disabled={submittingComment}
                style={{
                  ...resetButton,
                  border: "none",
                  outline: "none",
                  // 🎨 CUSTOMIZATION: Post button styling
                  fontWeight: 600,
                  fontSize: 14,
                  color: theme === 'dark' ? '#60A5FA' : '#0A99F6',
                  cursor: "pointer",
                }}
              >
                GIF
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreateComment}
                disabled={submittingComment}
                style={{
                  ...resetButton,
                  border: "none",
                  outline: "none",
                  // 🎨 CUSTOMIZATION: Post button styling
                  fontWeight: 600,
                  fontSize: 14,
                  color: theme === 'dark' ? '#60A5FA' : '#0A99F6',
                  cursor: "pointer",
                }}
              >
                Post
              </button>
            )}
          </div>
          {createErrorMessage && (
            <p
              role="alert"
              style={{
                // 🎨 CUSTOMIZATION: Failed-post message styling
                margin: 0,
                padding: "0 16px 8px",
                fontSize: 12,
                color: theme === 'dark' ? '#A3A3A3' : '#737373',
              }}
            >
              {createErrorMessage}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default NewCommentForm;
