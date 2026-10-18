import { Pressable, Text, View } from "react-native";
import { useUser, Comment as CommentType } from "@sublay/react-native";
import useUIState from "../../../hooks/use-ui-state";

interface ActionMenuProps {
  comment: CommentType;
}

function ActionMenu({ comment }: ActionMenuProps) {
  const { user } = useUser();
  const { theme, openCommentOptionsSheet, openCommentOptionsSheetOwner } = useUIState();

  return (
    <View style={{ position: 'relative' }}>
      <Pressable
        onPress={() =>
          user && user.id === comment.userId
            ? openCommentOptionsSheetOwner?.(comment)
            : openCommentOptionsSheet?.(comment)
        }
      >
        {/* The pressed look is on a view inside: NativeWind, when the app
            uses it, drops a `style` given as a function */}
        {({ pressed }) => (
          <View
            style={{
              padding: 3.5,
              borderRadius: 3.5,
              // 🎨 CUSTOMIZATION: Press feedback
              backgroundColor: pressed
                ? theme === 'dark' ? '#404040' : '#F9FAFB'
                : 'transparent',
              opacity: pressed ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                fontSize: 10.5,
                lineHeight: 14,
                // 🎨 CUSTOMIZATION: Menu icon color
                color: theme === 'dark' ? '#737373' : '#9CA3AF',
              }}
            >
              •••
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

export default ActionMenu;
