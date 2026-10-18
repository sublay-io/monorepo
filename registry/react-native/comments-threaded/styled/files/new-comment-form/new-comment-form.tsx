import { useCallback, useImperativeHandle, useRef, useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  StyleProp,
  ViewStyle,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  handleError,
  useUser,
  useCommentSection,
  useUserMentions,
  type CommentCreateError,
} from "@sublay/react-native";
import useTextInputCursorIndicator from "~shared/react-native/use-text-input-cursor-indicator";
import GiphyContainer from "~shared/react-native/giphy-container";
import SendIcon from "~shared/react-native/send-icon";

import MentionSuggestions from "../mention-suggestions/mention-suggestions";
import ReplyBanner from "../reply-banner/reply-banner";
import useUIState from "../../hooks/use-ui-state";
import { SECTION_PADDING_X } from "../comments-feed/comment-thread/single-comment/indentation-threading-lines";
import { getCommentCreateErrorMessage } from "../../utils/comment-create-error";
import strings from "../../utils/strings";
import { GIPHY_API_KEY_NAME, giphyApiKey, isDevelopment } from "../../utils/env";

function NewCommentForm({
  ref,
  containerStyle,
}: {
  ref?: React.Ref<{ focus: () => void }>;
  // Wraps the form in a View with this style (ThreadedCommentInput passes its
  // border and background here).
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const { user } = useUser();
  const { theme, commentInputRef } = useUIState();


  const { createComment, callbacks, createError } = useCommentSection();

  // This form posts top-level comments and, while a comment is the reply
  // target (its Reply button was tapped; see reply-banner.tsx), replies to
  // it. The section's `createComment` reads the target itself: it sends the
  // target's id as the new comment's parent, clears the target while the
  // request is in flight, and puts it back if the request fails. So nothing
  // here passes a parent, and a failed reply comes back as a reply.

  // A failed post (a comment or a reply) shows a message above the input,
  // until the text is edited or something is sent again (the section clears
  // `createError` then).
  const [dismissedCreateError, setDismissedCreateError] =
    useState<CommentCreateError | null>(null);
  const createErrorMessage =
    createError &&
    createError !== dismissedCreateError
      ? getCommentCreateErrorMessage(createError)
      : null;

  const [isGiphyVisible, setIsGiphyVisible] = useState(false);

  // The section's shared input ref when there is one, so a comment's Reply
  // button can focus this input (see focusCommentInput in ui-state-context).
  const ownInputRef = useRef<TextInput>(null);
  const textAreaRef = commentInputRef ?? ownInputRef;
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
              fontSize: 13,
              lineHeight: 18,
              paddingHorizontal: SECTION_PADDING_X,
              paddingBottom: 5.25,
              color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
            }}
          >
            {createErrorMessage}
          </Text>
        ) : null}
        {/* Shown while a comment is being replied to */}
        <ReplyBanner />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            padding: 7,
            // In line with the comments above
            marginHorizontal: SECTION_PADDING_X,
            marginBottom: 7,
            // No border of its own: the text sits in the comment area
          }}
        >
          <TextInput
            ref={textAreaRef}
            // Return adds a line break; the send button posts
            multiline
            numberOfLines={2}
            placeholder={strings.commentPlaceholder}
            value={content}
            onChangeText={(text) => {
              if (createError && text !== content) {
                setDismissedCreateError(createError);
              }
              setContent(text);
              handleTextChange(text);
            }}
            onSelectionChange={handleSelectionChange}
            placeholderTextColor={theme === 'dark' ? '#A3A3A3' : '#6B7280'}
            style={{
              flex: 1,
              padding: 7,
              // 🎨 CUSTOMIZATION: Input text size (Default: 14)
              fontSize: 14,
              lineHeight: 21,
              backgroundColor: 'transparent',
              // 🎨 CUSTOMIZATION: Input text color
              color: theme === 'dark' ? '#FAFAFA' : '#111827',
              textAlignVertical: 'top',
            }}
          />
          {!hasContent && (giphyApiKey || isDevelopment) ? (
            <TouchableOpacity
              onPress={openGifPicker}
              disabled={isSubmitting}
              style={{
                padding: 7,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 18,
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
                padding: 7,
                borderRadius: 9999,
                // 🎨 CUSTOMIZATION: Send button color
                backgroundColor:
                  hasContent && !isSubmitting
                    ? '#2563EB'
                    : theme === 'dark' ? '#525252' : '#E5E7EB',
              }}
            >
              {isSubmitting ? (
                <View
                  style={{
                    width: 16,
                    height: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ActivityIndicator
                    size="small"
                    color={theme === 'dark' ? '#FAFAFA' : '#FFFFFF'}
                    style={{ transform: [{ scale: 0.6 }] }}
                  />
                </View>
              ) : (
                <SendIcon
                  size={16}
                  color={
                    hasContent
                      ? '#FFFFFF'
                      : theme === 'dark' ? '#737373' : '#9CA3AF'
                  }
                />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <>
      {/* Over the whole screen, in a Modal: the input sits wherever the
          screen puts it */}
      {giphyApiKey ? (
        <GiphyContainer
          giphyApiKey={giphyApiKey}
          onClickBack={() => setIsGiphyVisible(false)}
          onSelectGif={(selected) => handleCreateGif(selected)}
          visible={isGiphyVisible}
          fullScreen
          theme={theme}
        />
      ) : null}
      {containerStyle ? <View style={containerStyle}>{form}</View> : form}
    </>
  );
}

NewCommentForm.displayName = "NewCommentForm";

export default NewCommentForm;
