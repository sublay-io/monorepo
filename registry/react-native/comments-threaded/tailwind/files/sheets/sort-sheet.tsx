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
          className={`px-8 py-4 flex-row border-b ${
            theme === 'dark' ? 'border-neutral-600' : 'border-gray-200'
          }`}
        >
          <Text
            className={`text-base font-semibold ${
              theme === 'dark' ? 'text-neutral-50' : 'text-gray-900'
            }`}
          >
            {strings.sortSheetTitle}
          </Text>
        </View>
      )}
    >
      <BottomSheetView className="p-4">
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
              // 🎨 CUSTOMIZATION: Sort option styling
              className={`flex-row items-center gap-4 p-3 rounded-lg ${
                theme === 'dark' ? 'active:bg-neutral-700' : 'active:bg-gray-50'
              }`}
            >
              <Text
                className={`text-base flex-1 ${isActive ? 'font-semibold' : ''} ${
                  theme === 'dark' ? 'text-neutral-50' : 'text-gray-700'
                }`}
              >
                {option.label}
              </Text>
              {isActive ? (
                <Text
                  className={`text-base ${
                    theme === 'dark' ? 'text-neutral-50' : 'text-gray-900'
                  }`}
                >
                  ✓
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </BottomSheetView>
    </BottomSheet>
  );
};

export default SortSheet;
