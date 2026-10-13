import { View, Text, Pressable } from "react-native";
import { useCallback, useMemo } from "react";
import FlagIcon from "~shared/react-native/flag-icon";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import useUIState from "../../hooks/use-ui-state";
import strings from "../../utils/strings";

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
          style={{
            paddingHorizontal: 32,
            paddingVertical: 16,
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: theme === 'dark' ? '#525252' : '#E5E7EB',
          }}
        >
          <Text
            style={{
              textTransform: 'uppercase',
              fontSize: 14,
              lineHeight: 20,
              color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
            }}
          >
            comment options
          </Text>
        </View>
      )}
    >
      <BottomSheetView style={{ padding: 16 }}>
        <Pressable
          onPress={() => {
            closeCommentOptionsSheet?.();
            openReportCommentSheet?.();
            setReportedComment?.(optionsComment!);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            padding: 12,
          }}
        >
          <FlagIcon
            size={20}
            color={theme === 'dark' ? '#FAFAFA' : '#6B7280'}
          />
          <Text
            style={{
              fontSize: 16,
              lineHeight: 24,
              flex: 1,
              color: theme === 'dark' ? '#FAFAFA' : '#374151',
            }}
          >
            {strings.report}
          </Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default CommentOptionsSheet;
