import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import useUIState from "../../../../hooks/use-ui-state";

function ReplyButtonAndInfo({
  hasReplies,
  replyCount,
  setShowReplyForm,
  canReply = true,
}: {
  hasReplies: boolean;
  replyCount: number;
  setShowReplyForm: React.Dispatch<React.SetStateAction<boolean>>;
  // false hides the Reply button (the reply count still shows).
  canReply?: boolean;
}) {
  const { theme } = useUIState();

  return (
    <View className="flex-row items-center gap-4">
      {canReply && (
      <TouchableOpacity
        onPress={() => setShowReplyForm((prev) => !prev)}
        className={`px-2 py-1 -ml-2 rounded ${
          theme === 'dark' ? 'active:bg-blue-400/10' : 'active:bg-blue-50'
        }`}
      >
        <Text
          className={`text-xs font-medium ${
            theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
          }`}
        >
          Reply
        </Text>
      </TouchableOpacity>
      )}
      {hasReplies && (
        <Text
          className={`text-xs ${
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
