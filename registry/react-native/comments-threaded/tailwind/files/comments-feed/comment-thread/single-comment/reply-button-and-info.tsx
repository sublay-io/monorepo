import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import useUIState from "../../../../hooks/use-ui-state";

function ReplyButtonAndInfo({
  hasReplies,
  replyCount,
  onReplyPress,
  canReply = true,
}: {
  hasReplies: boolean;
  replyCount: number;
  // Makes the comment the reply target, or cancels it if it already is.
  onReplyPress: () => void;
  // false hides the Reply button (the reply count still shows).
  canReply?: boolean;
}) {
  const { theme } = useUIState();

  return (
    <View className="flex-row items-center gap-4">
      {canReply && (
      <TouchableOpacity
        // Dim only a little, so the pressed tint shows
        activeOpacity={0.6}
        onPress={onReplyPress}
        className={`px-2 py-1 -ml-2 rounded ${
          theme === 'dark' ? 'active:bg-blue-400/10' : 'active:bg-blue-50'
        }`}
      >
        <Text
          className={`text-[13px] leading-[18px] font-medium ${
            theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
          }`}
        >
          Reply
        </Text>
      </TouchableOpacity>
      )}
      {hasReplies && (
        <Text
          className={`text-[13px] leading-[18px] ${
            theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
          }`}
        >
          {replyCount} {replyCount === 1 ? "reply" : "replies"}
        </Text>
      )}
    </View>
  );
}

export default ReplyButtonAndInfo;
