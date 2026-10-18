import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import useUIState from "../../../../hooks/use-ui-state";
import strings from "../../../../utils/strings";

// The reply count at the start of the row, and the comment's buttons at the
// end: the menu, then Reply (the vote buttons follow, in single-comment.tsx).
function ReplyButtonAndInfo({
  hasReplies,
  replyCount,
  onReplyPress,
  canReply = true,
  menu,
}: {
  hasReplies: boolean;
  replyCount: number;
  // Makes the comment the reply target, or cancels it if it already is.
  onReplyPress: () => void;
  // false hides the Reply button (the reply count still shows).
  canReply?: boolean;
  // The options button, shown before Reply.
  menu?: React.ReactNode;
}) {
  const { theme } = useUIState();

  return (
    <View className="flex-1 flex-row items-center justify-between gap-2">
      {hasReplies ? (
        <Text
          className={`text-[13px] leading-[18px] ${
            theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
          }`}
        >
          {strings.replyCount(replyCount)}
        </Text>
      ) : (
        <View />
      )}
      <View className="flex-row items-center gap-3">
        {menu}
        {canReply && (
          <TouchableOpacity
            // Dim only a little, so the pressed tint shows
            activeOpacity={0.6}
            onPress={onReplyPress}
            className={`px-2 py-1 rounded ${
              theme === 'dark' ? 'active:bg-blue-400/10' : 'active:bg-blue-50'
            }`}
          >
            <Text
              className={`text-[13px] leading-[18px] font-medium ${
                theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
              }`}
            >
              {strings.reply}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default ReplyButtonAndInfo;
