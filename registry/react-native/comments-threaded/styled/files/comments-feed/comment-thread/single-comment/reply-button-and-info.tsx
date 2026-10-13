import React from "react";
import { View, Text, Pressable } from "react-native";
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
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
      }}
    >
      {canReply && (
      <Pressable
        onPress={onReplyPress}
        style={({ pressed }) => ({
          paddingHorizontal: 8,
          paddingVertical: 4,
          marginLeft: -8,
          borderRadius: 4,
          // 🎨 CUSTOMIZATION: Press feedback
          backgroundColor: pressed
            ? theme === 'dark' ? 'rgba(96, 165, 250, 0.1)' : '#EFF6FF'
            : 'transparent',
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Text
          style={{
            fontSize: 12,
            lineHeight: 16,
            fontWeight: '500',
            color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
          }}
        >
          Reply
        </Text>
      </Pressable>
      )}
      {hasReplies && (
        <Text
          style={{
            fontSize: 12,
            lineHeight: 16,
            color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
          }}
        >
          {replyCount} {replyCount === 1 ? "reply" : "replies"}
        </Text>
      )}
    </View>
  );
}

export default ReplyButtonAndInfo;
