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
  const textColor = theme === 'dark' ? '#FAFAFA' : '#111827';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
        }}
      >
        {strings.sortBy}
      </Text>
      <Pressable
        onPress={() => openSortSheet?.()}
        accessibilityRole="button"
        accessibilityLabel={`${strings.sortBy}: ${current.label}`}
        style={({ pressed }) => ({
          // 🎨 CUSTOMIZATION: Sort button styling
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          height: 32,
          paddingHorizontal: 12,
          borderRadius: 9999,
          backgroundColor: pressed
            ? theme === 'dark' ? '#525252' : '#E5E7EB'
            : theme === 'dark' ? '#404040' : '#F3F4F6',
        })}
      >
        <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
          {current.label}
        </Text>
        <Text style={{ fontSize: 11, color: textColor }}>▾</Text>
      </Pressable>
    </View>
  );
}

export default SortByTrigger;
