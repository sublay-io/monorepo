import React from "react";
import { View, Text, Pressable } from "react-native";
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
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 7,
      }}
    >
      {hasReplies ? (
        <Text
          style={{
            fontSize: 13,
            lineHeight: 18,
            color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
          }}
        >
          {strings.replyCount(replyCount)}
        </Text>
      ) : (
        <View />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10.5 }}>
        {menu}
        {canReply && (
          <Pressable onPress={onReplyPress}>
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
      </View>
    </View>
  );
}

export default ReplyButtonAndInfo;
