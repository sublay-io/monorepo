import { View, Text, Pressable } from "react-native";
import { useCommentSection, getUserName } from "@sublay/react-native";
import UserAvatar from "~shared/react-native/user-avatar";
import useUIState from "../../hooks/use-ui-state";
import { SECTION_PADDING_X } from "../comments-feed/comment-thread/single-comment/indentation-threading-lines";

// 🎨 CUSTOMIZATION: Size of the avatar in the bar (Default: 20)
const REPLY_BANNER_AVATAR_SIZE = 20;

/**
 * The "Replying to" bar above the main input, shown while a comment is the
 * reply target (its Reply button was tapped). The cancel control clears the
 * target, and the input goes back to posting top-level comments.
 */
function ReplyBanner() {
  const { repliedToComment, setRepliedToComment, setShowReplyBanner } =
    useCommentSection();
  const { theme } = useUIState();

  if (!repliedToComment?.id) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: SECTION_PADDING_X,
        paddingBottom: 8,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          lineHeight: 18,
          // 🎨 CUSTOMIZATION: "Replying to" label color
          color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
        }}
      >
        Replying to
      </Text>
      <UserAvatar
        theme={theme}
        user={repliedToComment.user ?? {}}
        borderRadius={REPLY_BANNER_AVATAR_SIZE}
        size={REPLY_BANNER_AVATAR_SIZE}
      />
      <Text
        numberOfLines={1}
        style={{
          flexShrink: 1,
          fontSize: 13,
          lineHeight: 18,
          fontWeight: '600',
          // 🎨 CUSTOMIZATION: Author name color
          color: theme === 'dark' ? '#E5E5E5' : '#1F2937',
        }}
      >
        {getUserName(repliedToComment.user ?? {})}
      </Text>
      <Pressable
        onPress={() => {
          setRepliedToComment?.(null);
          setShowReplyBanner?.({ newState: false });
        }}
        accessibilityRole="button"
        accessibilityLabel="Cancel reply"
        hitSlop={8}
        style={({ pressed }) => ({
          marginLeft: 'auto',
          width: 20,
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 9999,
          // 🎨 CUSTOMIZATION: Cancel control background
          backgroundColor: theme === 'dark' ? '#404040' : '#F3F4F6',
          opacity: pressed ? 0.5 : 1,
        })}
      >
        <Text
          style={{
            fontSize: 14,
            lineHeight: 16,
            // 🎨 CUSTOMIZATION: Cancel control color
            color: theme === 'dark' ? '#D4D4D4' : '#4B5563',
          }}
        >
          ×
        </Text>
      </Pressable>
    </View>
  );
}

export default ReplyBanner;
