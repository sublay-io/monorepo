import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import {
  useCommentSection,
  useUser,
  Comment as CommentType,
} from "@sublay/react-native";
import useUIState from "../../../hooks/use-ui-state";

function NewReplyForm({
  comment,
  setShowReplyForm,
  replyContent,
  setReplyContent,
  errorMessage,
  onDismissError,
}: {
  comment: CommentType;
  setShowReplyForm: React.Dispatch<React.SetStateAction<boolean>>;
  // The text lives in the comment row: the form closes while a reply is being
  // sent, and comes back with the text if sending fails.
  replyContent: string;
  setReplyContent: React.Dispatch<React.SetStateAction<string>>;
  /** Why the last reply to this comment wasn't posted, if it wasn't. */
  errorMessage: string | null;
  onDismissError: () => void;
}) {
  const { user } = useUser();
  const { theme } = useUIState();

  const { createComment, callbacks } = useCommentSection();

  const handleReply = async () => {
    if (!replyContent.trim()) {
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

    const tempContent = replyContent.trim();

    // Clear optimistically before the API call
    setReplyContent("");
    setShowReplyForm(false);
    Keyboard.dismiss();

    try {
      const result = await createComment?.({
        content: tempContent,
        parentId: comment.id,
        mentions: [],
      });
      if (result === undefined) {
        // SDK handled the failure and removed the optimistic comment; restore form
        setReplyContent(tempContent);
        setShowReplyForm(true);
      }
    } catch (error) {
      console.error("Error creating reply:", error);
      setReplyContent(tempContent);
      setShowReplyForm(true);
    }
  };

  const handleCancelReply = () => {
    setShowReplyForm(false);
    setReplyContent("");
    onDismissError();
  };

  const hasContent = replyContent.trim().length > 0;

  return (
    <View className="mt-2">
      <View
        className={`flex-row items-end p-1.5 rounded-2xl ${
          hasContent
            ? theme === 'dark'
              ? 'border border-blue-900'
              : 'border border-blue-300'
            : theme === 'dark'
              ? 'border border-neutral-600'
              : 'border border-gray-200'
        } ${theme === 'dark' ? 'bg-neutral-800' : 'bg-white'}`}
      >
        <TextInput
          value={replyContent}
          onChangeText={(text) => {
            if (text !== replyContent) onDismissError();
            setReplyContent(text);
          }}
          placeholder="Add your reply..."
          multiline
          numberOfLines={2}
          className={`flex-1 py-1.5 px-2 text-xs bg-transparent ${
            theme === 'dark' ? 'text-neutral-50' : 'text-gray-900'
          }`}
          placeholderTextColor={theme === 'dark' ? '#A3A3A3' : '#6B7280'}
          style={{ textAlignVertical: 'top' }}
        />
        <View className="flex-row gap-1 ml-1">
          <TouchableOpacity
            onPress={handleCancelReply}
            className={`px-2 py-1 rounded ${
              theme === 'dark' ? 'active:bg-neutral-700' : 'active:bg-gray-50'
            }`}
          >
            <Text
              className={`text-xs ${
                theme === 'dark' ? 'text-neutral-400' : 'text-gray-600'
              }`}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleReply}
            disabled={!hasContent}
            className={`p-1.5 rounded-full ${
              hasContent
                ? theme === 'dark'
                  ? 'bg-blue-600'
                  : 'bg-blue-600'
                : theme === 'dark'
                  ? 'bg-neutral-600'
                  : 'bg-gray-200'
            }`}
          >
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
          </TouchableOpacity>
        </View>
      </View>
      {errorMessage ? (
        <Text
          accessibilityRole="alert"
          className={`text-xs mt-1.5 px-2 ${
            theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
          }`}
        >
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

export default NewReplyForm;
