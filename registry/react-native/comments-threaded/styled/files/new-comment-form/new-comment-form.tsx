import { useCallback, useImperativeHandle, useRef, useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  TextInputKeyPressEventData,
  NativeSyntheticEvent,
  ActivityIndicator,
} from "react-native";
import {
  handleError,
  useUser,
  useCommentSection,
  useUserMentions,
  useProject,
  type CommentCreateError,
} from "@sublay/react-native";
import {
  useTextInputCursorIndicator,
  GiphyContainer,
} from "@sublay/ui-core-react-native";

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

  const { createComment, callbacks, createError } = useCommentSection();

  // A failed post shows a message above the input, until the text is edited
  // or something is sent again (the section clears `createError` then).
  // Replies have their own form, which shows its own failures.
  const [dismissedCreateError, setDismissedCreateError] =
    useState<CommentCreateError | null>(null);
  const createErrorMessage =
    createError &&
    createError.parentId === null &&
    createError !== dismissedCreateError
      ? getCommentCreateErrorMessage(createError)
      : null;

  const [isGiphyVisible, setIsGiphyVisible] = useState(false);

  const textAreaRef = useRef<TextInput>(null);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setMentions,
    resetMentions,
  } = useUserMentions({
    content,
    setContent,
    focus: () => textAreaRef.current?.focus(),
    cursorPosition,
    isSelectionActive,
  });

  const hasContent = content.trim().length > 0;

  const handleCreateComment = useCallback(async () => {
    if (isSubmitting) return;

    if (!hasContent) {
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

    const tempContent = content.trim();
    const tempMentions = mentions;

    // Clear optimistically before the API call
    setContent("");
    resetMentions();
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  }, [
    hasContent,
    isSubmitting,
    user,
    createComment,
    mentions,
    resetMentions,
    callbacks,
    content,
  ]);

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
    [createComment, content, mentions, resetMentions, setMentions, user, callbacks]
  );

  const handleKeyPress = useCallback(
    (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (event.nativeEvent.key === "Enter") {
        handleCreateComment();
      }
    },
    [handleCreateComment]
  );

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
        />
      ) : null}
      <View
        style={{
          position: 'relative',
          overflow: 'visible',
          // 🎨 CUSTOMIZATION: Form background
          backgroundColor: theme === 'dark' ? '#262626' : '#FFFFFF',
        }}
      >
        <View
          style={{
            width: '100%',
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <MentionSuggestions
            isMentionActive={isMentionActive}
            isLoadingMentions={loading}
            mentionSuggestions={mentionSuggestions}
            handleMentionClick={handleMentionClick}
          />
        </View>
        <View
          style={{
            position: 'relative',
            zIndex: 20,
            backgroundColor: theme === 'dark' ? '#262626' : '#FFFFFF',
          }}
        >
          {createErrorMessage ? (
            <Text
              accessibilityRole="alert"
              style={{
                // 🎨 CUSTOMIZATION: Failed-post message styling
                fontSize: 12,
                lineHeight: 16,
                paddingHorizontal: 16,
                paddingBottom: 6,
                color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
              }}
            >
              {createErrorMessage}
            </Text>
          ) : null}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              padding: 8,
              marginHorizontal: 8,
              marginBottom: 8,
              borderRadius: 16,
              borderWidth: 1,
              // 🎨 CUSTOMIZATION: Input border (blue once there is text)
              borderColor: hasContent
                ? theme === 'dark' ? '#1E40AF' : '#93C5FD'
                : theme === 'dark' ? '#525252' : '#E5E7EB',
            }}
          >
            <TextInput
              ref={textAreaRef}
              multiline
              numberOfLines={2}
              placeholder="Add your reply..."
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
              blurOnSubmit={false}
              placeholderTextColor={theme === 'dark' ? '#A3A3A3' : '#6B7280'}
              style={{
                flex: 1,
                padding: 8,
                fontSize: 12,
                lineHeight: 16,
                backgroundColor: 'transparent',
                // 🎨 CUSTOMIZATION: Input text color
                color: theme === 'dark' ? '#FAFAFA' : '#111827',
                textAlignVertical: 'top',
              }}
            />
            {!hasContent && giphyApiKey ? (
              <TouchableOpacity
                onPress={() => setIsGiphyVisible(true)}
                disabled={isSubmitting}
                style={{
                  padding: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    lineHeight: 16,
                    fontWeight: '400',
                    color: theme === 'dark' ? '#FAFAFA' : '#6B7280',
                  }}
                >
                  GIF
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleCreateComment}
                disabled={!hasContent || isSubmitting}
                style={{
                  padding: 8,
                  borderRadius: 9999,
                  // 🎨 CUSTOMIZATION: Send button color
                  backgroundColor:
                    hasContent && !isSubmitting
                      ? '#2563EB'
                      : theme === 'dark' ? '#525252' : '#E5E7EB',
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator
                    size="small"
                    color={theme === 'dark' ? '#FAFAFA' : '#FFFFFF'}
                    style={{ width: 12, height: 12 }}
                  />
                ) : (
                  <View
                    style={{ width: 12, height: 12, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        lineHeight: 16,
                        color: hasContent
                          ? '#FFFFFF'
                          : theme === 'dark' ? '#737373' : '#9CA3AF',
                      }}
                    >
                      ↑
                    </Text>
                  </View>
                )}
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
