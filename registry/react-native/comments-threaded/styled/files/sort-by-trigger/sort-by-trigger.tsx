import { View, Text, Pressable } from "react-native";
import { useCommentSection } from "@sublay/react-native";
import ChevronIcon from "~shared/react-native/chevron-icon";
import useUIState from "../../hooks/use-ui-state";
import { findSortOption } from "../../utils/sort-options";
import strings from "../../utils/strings";

// "Sort by: Top", with a chevron. Opens the sort sheet, which ThreadedComments renders over
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
        gap: 7,
        paddingVertical: 3.5,
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
      >
        {/* The pressed look is on a view inside: NativeWind, when the app
            uses it, drops a `style` given as a function */}
        {({ pressed }) => (
          <View
            style={{
              // 🎨 CUSTOMIZATION: Sort button styling
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3.5,
              height: 28,
              paddingHorizontal: 10.5,
              borderRadius: 9999,
              backgroundColor: pressed
                ? theme === 'dark' ? '#525252' : '#E5E7EB'
                : theme === 'dark' ? '#404040' : '#F3F4F6',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
              {current.label}
            </Text>
            <ChevronIcon direction="down" size={14} strokeWidth={2.5} color={textColor} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

export default SortByTrigger;
