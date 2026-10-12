import { View, Text, Pressable } from "react-native";
import { useCallback, useMemo } from "react";
import FlagIcon from "~shared/react-native/flag-icon";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import useUIState from "../../hooks/use-ui-state";

const CommentOptionsSheet = () => {
  const {
    commentOptionsSheetRef,
    setOptionsComment,
    closeCommentOptionsSheet,
    openReportCommentSheet,
    setReportedComment,
    optionsComment,
    theme,
  } = useUIState();

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
      ref={commentOptionsSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onChange={(state) => {
        if (state === -1) {
          setOptionsComment?.(null);
        }
      }}
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
            className={`uppercase text-sm ${
              theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
            }`}
          >
            comment options
          </Text>
        </View>
      )}
    >
      <BottomSheetView className="p-4">
        <Pressable
          onPress={() => {
            closeCommentOptionsSheet?.();
            openReportCommentSheet?.();
            setReportedComment?.(optionsComment!);
          }}
          className="flex-row items-center gap-4 p-3"
        >
          <FlagIcon
            size={20}
            color={theme === 'dark' ? '#FAFAFA' : '#6B7280'}
          />
          <Text
            className={`text-base flex-1 ${
              theme === 'dark' ? 'text-neutral-50' : 'text-gray-700'
            }`}
          >
            Report
          </Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default CommentOptionsSheet;
