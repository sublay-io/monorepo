import { useCallback, useImperativeHandle, useRef, useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
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

import MentionSuggestions from "../mention-suggestions/mention-suggestions";
import ReplyBanner from "../reply-banner/reply-banner";
import useUIState from "../../hooks/use-ui-state";
import { SECTION_PADDING_X } from "../comments-feed/comment-thread/single-comment/indentation-threading-lines";
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
        `GIFs need a Giphy API key. Set ${GIPHY_API_KEY_NAME} in your environment, or change where it's read in this component's utils/env.ts.`
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
            className={`text-[13px] leading-[18px] pb-1.5 ${
              theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
            }`}
            style={{ paddingHorizontal: SECTION_PADDING_X }}
          >
            {createErrorMessage}
          </Text>
        ) : null}
        {/* Shown while a comment is being replied to */}
        <ReplyBanner />
        <View
          className={`flex-row items-end p-2 mb-2 rounded-2xl ${
            hasContent
              ? theme === 'dark'
                ? 'border border-blue-800'
                : 'border border-blue-300'
              : theme === 'dark'
                ? 'border border-neutral-600'
                : 'border border-gray-200'
          }`}
          // In line with the comments above
          style={{ marginHorizontal: SECTION_PADDING_X }}
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
            className={`flex-1 p-2 text-sm bg-transparent ${
              theme === 'dark' ? 'text-neutral-50' : 'text-gray-900'
            }`}
            placeholderTextColor={theme === 'dark' ? '#A3A3A3' : '#6B7280'}
            style={{ textAlignVertical: 'top' }}
          />
          {!hasContent && (giphyApiKey || isDevelopment) ? (
            <TouchableOpacity
              onPress={openGifPicker}
              disabled={isSubmitting}
              className="p-2"
            >
              <Text
                className={`text-[13px] leading-[18px] font-normal ${
                  theme === 'dark' ? 'text-neutral-50' : 'text-gray-500'
                }`}
              >
                GIF
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleCreateComment}
              disabled={!hasContent || isSubmitting}
              className={`p-2 rounded-full ${
                hasContent && !isSubmitting
                  ? theme === 'dark'
                    ? 'bg-blue-600'
                    : 'bg-blue-600'
                  : theme === 'dark'
                    ? 'bg-neutral-600'
                    : 'bg-gray-200'
              }`}
            >
              {isSubmitting ? (
                <View
                  style={{
                    width: 12,
                    height: 12,
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
                <View
                  style={{ width: 12, height: 12, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text
                    className={`text-xs ${
                      hasContent
                        ? 'text-white'
                        : theme === 'dark'
                          ? 'text-neutral-500'
                          : 'text-gray-400'
                    }`}
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
