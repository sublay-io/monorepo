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
      className="flex-row items-center gap-1.5 pb-2"
      style={{ paddingHorizontal: SECTION_PADDING_X }}
    >
      {/* 🎨 CUSTOMIZATION: "Replying to" label color */}
      <Text
        className={`text-[13px] leading-[18px] ${
          theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
        }`}
      >
        Replying to
      </Text>
      <UserAvatar
        theme={theme}
        user={repliedToComment.user ?? {}}
        borderRadius={REPLY_BANNER_AVATAR_SIZE}
        size={REPLY_BANNER_AVATAR_SIZE}
      />
      {/* 🎨 CUSTOMIZATION: Author name color */}
      <Text
        numberOfLines={1}
        className={`shrink text-[13px] leading-[18px] font-semibold ${
          theme === 'dark' ? 'text-neutral-200' : 'text-gray-800'
        }`}
      >
        {getUserName(repliedToComment.user ?? {})}
      </Text>
      {/* 🎨 CUSTOMIZATION: Cancel control background and color */}
      <Pressable
        onPress={() => {
          setRepliedToComment?.(null);
          setShowReplyBanner?.({ newState: false });
        }}
        accessibilityRole="button"
        accessibilityLabel="Cancel reply"
        hitSlop={8}
        className={`ms-auto w-5 h-5 items-center justify-center rounded-full active:opacity-50 ${
          theme === 'dark' ? 'bg-neutral-700' : 'bg-gray-100'
        }`}
      >
        <Text
          className={`text-sm leading-4 ${
            theme === 'dark' ? 'text-neutral-300' : 'text-gray-600'
          }`}
        >
          ×
        </Text>
      </Pressable>
    </View>
  );
}

export default ReplyBanner;
