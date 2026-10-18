import React from "react";
import { View, Text, Pressable } from "react-native";
import useUIState from "../../../../hooks/use-ui-state";
import strings from "../../../../utils/strings";

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
        gap: 14,
      }}
    >
      {canReply && (
      <Pressable
        onPress={onReplyPress}
        style={{ marginStart: -7 }}
      >
        {/* The pressed look is on a view inside: NativeWind, when the app
            uses it, drops a `style` given as a function */}
        {({ pressed }) => (
          <View
            style={{
              paddingHorizontal: 7,
              paddingVertical: 3.5,
              borderRadius: 3.5,
              // 🎨 CUSTOMIZATION: Press feedback
              backgroundColor: pressed
                ? theme === 'dark' ? 'rgba(96, 165, 250, 0.1)' : '#EFF6FF'
                : 'transparent',
              opacity: pressed ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                lineHeight: 18,
                fontWeight: '500',
                color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
              }}
            >
              {strings.reply}
            </Text>
          </View>
        )}
      </Pressable>
      )}
      {hasReplies && (
        <Text
          style={{
            fontSize: 13,
            lineHeight: 18,
            color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
          }}
        >
          {strings.replyCount(replyCount)}
        </Text>
      )}
    </View>
  );
}

export default ReplyButtonAndInfo;
