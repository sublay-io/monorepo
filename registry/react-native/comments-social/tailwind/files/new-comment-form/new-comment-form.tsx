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
  Alert,
} from "react-native";
import {
  handleError,
  useUser,
  useCommentSection,
  useUserMentions,
  type CommentCreateError,
} from "@sublay/react-native";
import UserAvatar from "~shared/react-native/user-avatar";
import useTextInputCursorIndicator from "~shared/react-native/use-text-input-cursor-indicator";
import EmojiSuggestions from "~shared/react-native/emoji-suggestions";
import GiphyContainer from "~shared/react-native/giphy-container";

import ReplyBanner from "../reply-banner/reply-banner";
import MentionSuggestions from "../mention-suggestions/mention-suggestions";
import useUIState from "../../hooks/use-ui-state";
import { getCommentCreateErrorMessage } from "../../utils/comment-create-error";
import strings from "../../utils/strings";
import { GIPHY_API_KEY_NAME, giphyApiKey, isDevelopment } from "../../utils/env";

function NewCommentForm({
  ref,
  gifPickerFullScreen = false,
  containerClassName,
}: {
  ref?: React.Ref<{ focus: () => void }>;
  // Where the GIF picker opens. false: it covers the view this form is
  // rendered in (in the section, the whole comment section). true: it covers
  // the whole screen.
  gifPickerFullScreen?: boolean;
  // Wraps the form in a View with these classes. The section passes its
  // border here instead of wrapping the form itself: the GIF picker fills the
  // view the form is rendered in, and that has to be the section's root view.
  containerClassName?: string;
}) {
  const { user } = useUser();
  const { theme } = useUIState();

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

  // CUSTOMIZATION: Form styling defaults
  const withAvatar = true;
  const authorAvatarSize = 32;
  const placeholderText = strings.commentPlaceholder;

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

  // Without a key the GIF button shows only in development, and says what
  // to set instead of opening the picker
  const openGifPicker = () => {
    if (!giphyApiKey) {
      Alert.alert(
        "Giphy API key missing",
        `GIFs need a Giphy API key. Set ${GIPHY_API_KEY_NAME} in your environment, or change where it's read in this component's utils/env file.`
      );
      return;
    }
    setIsGiphyVisible(true);
  };

  const form = (
    <View
      className={`relative overflow-visible ${
        theme === 'dark' ? 'bg-neutral-800' : 'bg-white'
      }`}
    >
      <View className="w-full relative overflow-visible">
        <ReplyBanner />
        <MentionSuggestions
          isMentionActive={isMentionActive}
          isLoadingMentions={loading}
          mentionSuggestions={mentionSuggestions}
          handleMentionClick={handleMentionClick}
        />
      </View>
      <View
        className={`relative z-20 ${
          theme === 'dark' ? 'bg-neutral-800' : 'bg-white'
        }`}
      >
        {createErrorMessage ? (
          <Text
            accessibilityRole="alert"
            className={`text-xs px-4 pt-2 pb-1 ${
              theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'
            }`}
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
          className={`flex-row items-center justify-end gap-2 py-2 ps-2 pe-4 border-t ${
            theme === 'dark' ? 'border-neutral-600' : 'border-gray-200'
          }`}
        >
          {user && withAvatar && (
            <UserAvatar
theme={theme}
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
            className={`flex-1 mx-2 text-sm bg-transparent border-0 p-0 m-0 ${
              theme === 'dark' ? 'text-neutral-200' : 'text-black'
            }`}
            placeholderTextColor={theme === 'dark' ? '#A3A3A3' : '#6B7280'}
          />

          {content.length === 0 && (giphyApiKey || isDevelopment) ? (
            <TouchableOpacity
              onPress={openGifPicker}
              disabled={submittingComment}
              className="bg-transparent border-0 p-0 m-0"
            >
              <Text
                className={`font-semibold text-sm ${
                  theme === 'dark' ? 'text-blue-400' : 'text-sky-500'
                }`}
              >
                GIF
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleCreateComment}
              disabled={submittingComment}
              className="bg-transparent border-0 p-0 m-0"
            >
              <Text
                className={`font-semibold text-sm ${
                  theme === 'dark' ? 'text-blue-400' : 'text-sky-500'
                }`}
              >
                {strings.post}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <>
      {/* Fills the view this form is rendered in (see gifPickerFullScreen) */}
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
      {containerClassName ? (
        <View className={containerClassName}>{form}</View>
      ) : (
        form
      )}
    </>
  );
}

NewCommentForm.displayName = "NewCommentForm";

export default NewCommentForm;
