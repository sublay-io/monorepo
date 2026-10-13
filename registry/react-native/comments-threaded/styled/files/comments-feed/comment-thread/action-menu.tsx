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
        style={({ pressed }) => ({
          padding: 4,
          borderRadius: 4,
          // 🎨 CUSTOMIZATION: Press feedback
          backgroundColor: pressed
            ? theme === 'dark' ? '#404040' : '#F9FAFB'
            : 'transparent',
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Text
          style={{
            fontSize: 12,
            lineHeight: 16,
            // 🎨 CUSTOMIZATION: Menu icon color
            color: theme === 'dark' ? '#737373' : '#9CA3AF',
          }}
        >
          •••
        </Text>
      </Pressable>
    </View>
  );
}

export default ActionMenu;
