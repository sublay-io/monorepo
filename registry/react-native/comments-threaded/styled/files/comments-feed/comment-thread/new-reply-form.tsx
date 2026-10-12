import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
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
    <View style={{ marginTop: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          padding: 6,
          borderRadius: 16,
          borderWidth: 1,
          // 🎨 CUSTOMIZATION: Input border (blue once there is text)
          borderColor: hasContent
            ? theme === 'dark' ? '#1E3A8A' : '#93C5FD'
            : theme === 'dark' ? '#525252' : '#E5E7EB',
          backgroundColor: theme === 'dark' ? '#262626' : '#FFFFFF',
        }}
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
          placeholderTextColor={theme === 'dark' ? '#A3A3A3' : '#6B7280'}
          style={{
            flex: 1,
            paddingVertical: 6,
            paddingHorizontal: 8,
            fontSize: 12,
            lineHeight: 16,
            backgroundColor: 'transparent',
            // 🎨 CUSTOMIZATION: Input text color
            color: theme === 'dark' ? '#FAFAFA' : '#111827',
            textAlignVertical: 'top',
          }}
        />
        <View
          style={{
            flexDirection: 'row',
            gap: 4,
            marginLeft: 4,
          }}
        >
          <Pressable
            onPress={handleCancelReply}
            style={({ pressed }) => ({
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4,
              // 🎨 CUSTOMIZATION: Press feedback
              backgroundColor: pressed
                ? theme === 'dark' ? '#404040' : '#F9FAFB'
                : 'transparent',
              opacity: pressed ? 0.2 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 12,
                lineHeight: 16,
                color: theme === 'dark' ? '#A3A3A3' : '#4B5563',
              }}
            >
              Cancel
            </Text>
          </Pressable>
          <TouchableOpacity
            onPress={handleReply}
            disabled={!hasContent}
            style={{
              padding: 6,
              borderRadius: 9999,
              // 🎨 CUSTOMIZATION: Send button color
              backgroundColor: hasContent
                ? '#2563EB'
                : theme === 'dark' ? '#525252' : '#E5E7EB',
            }}
          >
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
          </TouchableOpacity>
        </View>
      </View>
      {errorMessage ? (
        <Text
          accessibilityRole="alert"
          style={{
            // 🎨 CUSTOMIZATION: Failed-reply message styling
            fontSize: 12,
            lineHeight: 16,
            marginTop: 6,
            paddingHorizontal: 8,
            color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
          }}
        >
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

export default NewReplyForm;
