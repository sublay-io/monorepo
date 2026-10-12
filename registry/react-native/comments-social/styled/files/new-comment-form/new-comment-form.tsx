import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  TextInputKeyPressEventData,
  NativeSyntheticEvent,
} from "react-native";
import {
  handleError,
  useUser,
  useCommentSection,
  useUserMentions,
  useProject,
  type CommentCreateError,
} from "@sublay/react-native";
import { resetButton, resetTextInput, resetView } from "~shared/react-native/reset-styles";
import UserAvatar from "~shared/react-native/user-avatar";
import useTextInputCursorIndicator from "~shared/react-native/use-text-input-cursor-indicator";
import EmojiSuggestions from "~shared/react-native/emoji-suggestions";
import GiphyContainer from "~shared/react-native/giphy-container";

import ReplyBanner from "../reply-banner/reply-banner";
import MentionSuggestions from "../mention-suggestions/mention-suggestions";
import useUIState from "../../hooks/use-ui-state";
import { getCommentCreateErrorMessage } from "../../utils/comment-create-error";

function NewCommentForm({
  ref,
}: {
  ref?: React.Ref<{ focus: () => void }>;
}) {
  const { user } = useUser();
  const { project } = useProject();
  const { theme } = useUIState();

  const giphyApiKey = project?.integrations.find((int) => int.name === "giphy")
    ?.data.apiKey;

  const { pushMention, createComment, submittingComment, callbacks, createError } =
    useCommentSection();

  // A failed post (a comment or a reply: both are sent from this form) shows
  // a message above the input, until the text is edited or something is sent
  // again (the section clears `createError` then).
  const [dismissedCreateError, setDismissedCreateError] =
    useState<CommentCreateError | null>(null);
  const createErrorMessage =
    createError && createError !== dismissedCreateError
      ? getCommentCreateErrorMessage(createError)
      : null;

  const [isGiphyVisible, setIsGiphyVisible] = useState(false);

  // 🎨 CUSTOMIZATION: Form styling defaults
  const backgroundColor = theme === 'dark' ? '#262626' : '#fff';
  const withAvatar = true;
  const itemsGap = 8;
  const verticalPadding = 8;
  const paddingLeft = 8;
  const paddingRight = 16;
  const authorAvatarSize = 32;
  const placeholderText = "Add a comment...";
  const textareaTextSize = 14;
  const textareaTextColor = theme === 'dark' ? '#E5E5E5' : '#000';
  const textareaBackgroundColor = theme === 'dark' ? '#262626' : '#fff';
  const postButtonText = "Post";
  const postButtonFontSize = 14;
  const postButtonFontColor = theme === 'dark' ? '#60A5FA' : '#0A99F6';
  const postButtonFontWeight = '600' as const;

  const textAreaRef = useRef<TextInput>(null);
  const [content, setContent] = useState("");

  const {
    cursorPosition,
    isSelectionActive,
    handleSelectionChange,
    handleTextChange,
  } = useTextInputCursorIndicator();

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
    content,
    setContent,
    focus: () => textAreaRef.current?.focus(),
    cursorPosition,
    isSelectionActive,
  });

  const handleCreateComment = useCallback(async () => {
    if (content.trim().length === 0) {
      callbacks?.commentTooShortCallback?.();
      return;
    }

    if (!user) {
      callbacks?.loginRequiredCallback?.();
      return;
    }

    if (!user.username && callbacks?.usernameRequiredCallback) {
      callbacks.usernameRequiredCallback();
      return;
    }

    const tempContent = content;
    const tempMentions = mentions;

    // Clear optimistically before the API call
    setContent("");
    resetMentions();
    Keyboard.dismiss();

    try {
      const result = await createComment!({ content: tempContent, mentions: tempMentions });
      if (result === undefined) {
        // SDK handled the failure and removed the optimistic comment; restore form
        setContent(tempContent);
        setMentions(tempMentions);
      }
    } catch (err) {
      setContent(tempContent);
      setMentions(tempMentions);
      handleError(err, "Creating comment failed: ");
    }
  }, [createComment, content, mentions, resetMentions, callbacks, user]);

  const handleCreateGif = useCallback(
    async (gif: {
      id: string;
      url: string;
      gifUrl: string;
      gifPreviewUrl: string;
      altText: string;
      aspectRatio: string;
    }) => {
      const tempContent = content;
      const tempMentions = mentions;

      setContent("");
      resetMentions();
      setIsGiphyVisible(false);

      try {
        const result = await createComment?.({ gif, mentions: tempMentions });
        if (result === undefined) {
          // Nothing was posted: put the text and mentions back
          setContent(tempContent);
          setMentions(tempMentions);
        }
      } catch (err) {
        handleError(err, "Creating comment failed: ");
        setContent(tempContent);
        setMentions(tempMentions);
      }
    },
    [createComment, content, mentions, resetMentions, setMentions]
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

    setContent((prevContent) => `@${pushMention.username} ${prevContent}`);
  }, [pushMention]);

  const handleKeyPress = useCallback(
    (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (event.nativeEvent.key === "Enter") {
        handleCreateComment();
      }
    },
    [handleCreateComment]
  );

  const adjustTextareaHeight = () => {
    const textArea = textAreaRef.current;
    if (textArea) {
      textArea.measure((_fx, _fy, _width, height) => {
        const baseHeight = 20;
        const newHeight = Math.max(baseHeight, Math.min(100, height));
        textArea.setNativeProps({
          style: { height: newHeight },
        });
      });
    }
  };

  useLayoutEffect(() => {
    const timeout = setTimeout(() => adjustTextareaHeight(), 500);
    return () => clearTimeout(timeout);
  }, []);

  // Expose the focus method to the parent through the forwarded ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      textAreaRef.current?.focus();
    },
  }));

  return (
    <>
      {giphyApiKey ? (
        <GiphyContainer
          giphyApiKey={giphyApiKey}
          onClickBack={() => setIsGiphyVisible(false)}
          onSelectGif={(selected) => handleCreateGif(selected)}
          visible={isGiphyVisible}
          theme={theme}
        />
      ) : null}
      <View
        style={{
          ...resetView,
          position: "relative",
          overflow: "visible",
          backgroundColor,
        }}
      >
        <View
          style={{ width: "100%", position: "relative", overflow: "visible" }}
        >
          <ReplyBanner />
          <MentionSuggestions
            isMentionActive={isMentionActive}
            isLoadingMentions={loading}
            mentionSuggestions={mentionSuggestions}
            handleMentionClick={handleMentionClick}
          />
        </View>
        <View
          style={{
            ...resetView,
            position: "relative",
            zIndex: 20,
            backgroundColor,
          }}
        >
          {createErrorMessage ? (
            <Text
              accessibilityRole="alert"
              style={{
                // 🎨 CUSTOMIZATION: Failed-post message styling
                fontSize: 12,
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: 4,
                color: theme === 'dark' ? '#A3A3A3' : '#737373',
              }}
            >
              {createErrorMessage}
            </Text>
          ) : null}
          <EmojiSuggestions
            onEmojiClick={(emoji) => {
              setContent((c) => c + emoji);
            }}
            theme={theme}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: itemsGap,
              paddingTop: verticalPadding,
              paddingBottom: verticalPadding,
              paddingLeft,
              paddingRight,
              borderTopColor: theme === 'dark' ? "#525252" : "#e7e7e7",
              borderTopWidth: 1,
            }}
          >
            {user && withAvatar && (
              <UserAvatar
                user={user}
                size={authorAvatarSize}
                borderRadius={authorAvatarSize}
              />
            )}
            <TextInput
              ref={textAreaRef}
              numberOfLines={1}
              placeholder={placeholderText}
              value={content}
              onChangeText={(text) => {
                if (createError && text !== content) {
                  setDismissedCreateError(createError);
                }
                setContent(text);
                handleTextChange(text);
              }}
              onSelectionChange={handleSelectionChange}
              onKeyPress={handleKeyPress}
              onSubmitEditing={() => handleCreateComment()}
              blurOnSubmit={false}
              style={{
                ...resetTextInput,
                flex: 1,
                marginHorizontal: 8,
                fontSize: textareaTextSize,
                backgroundColor: textareaBackgroundColor,
                color: textareaTextColor,
              }}
            />

            {content.length === 0 && giphyApiKey ? (
              <TouchableOpacity
                onPress={() => setIsGiphyVisible(true)}
                disabled={submittingComment}
                style={{ ...resetButton }}
              >
                <Text
                  style={{
                    fontWeight: postButtonFontWeight,
                    fontSize: postButtonFontSize,
                    color: postButtonFontColor,
                  }}
                >
                  GIF
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleCreateComment}
                disabled={submittingComment}
                style={{ ...resetButton }}
              >
                <Text
                  style={{
                    fontWeight: postButtonFontWeight,
                    fontSize: postButtonFontSize,
                    color: postButtonFontColor,
                  }}
                >
                  {postButtonText}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </>
  );
}

NewCommentForm.displayName = "NewCommentForm";

export default NewCommentForm;
