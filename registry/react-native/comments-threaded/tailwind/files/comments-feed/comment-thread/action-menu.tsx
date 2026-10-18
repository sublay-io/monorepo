import { TouchableOpacity, View } from "react-native";
import EllipsisVerticalIcon from "~shared/react-native/ellipsis-vertical-icon";
import { useUser, Comment as CommentType } from "@sublay/react-native";
import useUIState from "../../../hooks/use-ui-state";
import strings from "../../../utils/strings";

interface ActionMenuProps {
  comment: CommentType;
}

function ActionMenu({ comment }: ActionMenuProps) {
  const { user } = useUser();
  const { theme, openCommentOptionsSheet, openCommentOptionsSheetOwner } = useUIState();

  return (
    <View className="relative">
      <TouchableOpacity
        // Dim only a little, so the pressed tint shows
        activeOpacity={0.6}
        onPress={() =>
          user && user.id === comment.userId
            ? openCommentOptionsSheetOwner?.(comment)
            : openCommentOptionsSheet?.(comment)
        }
        accessibilityRole="button"
        accessibilityLabel={strings.moreOptions}
        className={`p-1 rounded ${
          theme === 'dark' ? 'active:bg-neutral-700' : 'active:bg-gray-50'
        }`}
      >
        <EllipsisVerticalIcon
          size={18}
          color={theme === 'dark' ? '#737373' : '#9CA3AF'}
        />
      </TouchableOpacity>
    </View>
  );
}

export default ActionMenu;
