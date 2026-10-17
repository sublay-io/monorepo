import { View, Text, Pressable } from "react-native";
import { useCommentSection } from "@sublay/react-native";
import useUIState from "../../hooks/use-ui-state";
import { findSortOption } from "../../utils/sort-options";
import strings from "../../utils/strings";

// "Sort by: Top ▾". Opens the sort sheet, which ThreadedComments renders over
// the screen; move this button anywhere inside ThreadedComments.
function SortByTrigger() {
  const { sortBy, sortDir } = useCommentSection();
  const { theme, openSortSheet } = useUIState();
  const current = findSortOption(sortBy, sortDir);

  return (
    <View className="flex-row items-center gap-2 py-1">
      <Text
        className={`text-[13px] ${
          theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
        }`}
      >
        {strings.sortBy}
      </Text>
      <Pressable
        onPress={() => openSortSheet?.()}
        accessibilityRole="button"
        accessibilityLabel={`${strings.sortBy}: ${current.label}`}
        // 🎨 CUSTOMIZATION: Sort button styling
        className={`flex-row items-center gap-1 h-8 px-3 rounded-full ${
          theme === 'dark'
            ? 'bg-neutral-700 active:bg-neutral-600'
            : 'bg-gray-100 active:bg-gray-200'
        }`}
      >
        <Text
          className={`text-[13px] font-semibold ${
            theme === 'dark' ? 'text-neutral-50' : 'text-gray-900'
          }`}
        >
          {current.label}
        </Text>
        <Text
          className={`text-[11px] ${
            theme === 'dark' ? 'text-neutral-50' : 'text-gray-900'
          }`}
        >
          ▾
        </Text>
      </Pressable>
    </View>
  );
}

export default SortByTrigger;
