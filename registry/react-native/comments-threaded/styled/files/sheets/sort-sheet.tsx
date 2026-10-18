import { View, Text, Pressable } from "react-native";
import { useCallback, useMemo } from "react";
import { useCommentSection } from "@sublay/react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import useUIState from "../../hooks/use-ui-state";
import { SORT_OPTIONS, findSortOption } from "../../utils/sort-options";
import strings from "../../utils/strings";

const SortSheet = () => {
  const { sortBy, setSortBy, sortDir, setSortDir } = useCommentSection();
  const { sortSheetRef, closeSortSheet, theme } = useUIState();
  const current = findSortOption(sortBy, sortDir);

  const snapPoints = useMemo(() => ["100%"], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  return (
    <BottomSheet
      ref={sortSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: theme === 'dark' ? '#262626' : '#FFFFFF',
      }}
      handleIndicatorStyle={{
        backgroundColor: theme === 'dark' ? '#A3A3A3' : '#D1D5DB',
      }}
      handleComponent={() => (
        <View
          style={{
            paddingHorizontal: 28,
            paddingVertical: 14,
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: theme === 'dark' ? '#525252' : '#E5E7EB',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              lineHeight: 21,
              fontWeight: '600',
              color: theme === 'dark' ? '#FAFAFA' : '#111827',
            }}
          >
            {strings.sortSheetTitle}
          </Text>
        </View>
      )}
    >
      <BottomSheetView style={{ padding: 14 }}>
        {SORT_OPTIONS.map((option) => {
          const isActive = option === current;
          return (
            <Pressable
              key={option.label}
              onPress={() => {
                setSortBy?.(option.sortBy);
                setSortDir?.(option.sortDir);
                closeSortSheet?.();
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: isActive }}
            >
              {/* The pressed look is on a view inside: NativeWind, when the
                  app uses it, drops a `style` given as a function */}
              {({ pressed }) => (
                <View
                  style={{
                    // 🎨 CUSTOMIZATION: Sort option styling
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    padding: 10.5,
                    borderRadius: 7,
                    backgroundColor: pressed
                      ? theme === 'dark' ? '#404040' : '#F9FAFB'
                      : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      lineHeight: 21,
                      flex: 1,
                      fontWeight: isActive ? '600' : '400',
                      color: theme === 'dark' ? '#FAFAFA' : '#374151',
                    }}
                  >
                    {option.label}
                  </Text>
                  {isActive ? (
                    <Text
                      style={{
                        fontSize: 14,
                        lineHeight: 21,
                        color: theme === 'dark' ? '#FAFAFA' : '#111827',
                      }}
                    >
                      ✓
                    </Text>
                  ) : null}
                </View>
              )}
            </Pressable>
          );
        })}
      </BottomSheetView>
    </BottomSheet>
  );
};

export default SortSheet;
