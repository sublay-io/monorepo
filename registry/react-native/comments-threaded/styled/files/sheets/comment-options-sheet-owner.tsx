import { View, Text, Pressable, Alert } from "react-native";
import { useCallback, useMemo } from "react";
import { useCommentSection } from "@sublay/react-native";
import TrashIcon from "~shared/react-native/trash-icon";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import useUIState from "../../hooks/use-ui-state";
import strings from "../../utils/strings";

const CommentOptionsSheetOwner = () => {
  const { deleteComment } = useCommentSection();
  const {
    commentOptionsSheetOwnerRef,
    setOptionsComment,
    closeCommentOptionsSheetOwner,
    optionsComment,
    theme,
  } = useUIState();

  const snapPoints = useMemo(() => ["100%"], []);

  const handleDeleteComment = () => {
    Alert.alert(
      strings.deleteCommentTitle,
      strings.confirmDelete,
      [
        {
          text: strings.cancel,
          style: "cancel",
          onPress: () => {
            closeCommentOptionsSheetOwner?.();
          },
        },
        {
          text: strings.delete,
          style: "destructive",
          onPress: () => {
            deleteComment?.({ commentId: optionsComment!.id });
            closeCommentOptionsSheetOwner?.();
          },
        },
      ],
      { cancelable: false }
    );
  };

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
      ref={commentOptionsSheetOwnerRef}
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
          onPress={handleDeleteComment}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            padding: 12,
          }}
        >
          <TrashIcon
            size={20}
            color={theme === 'dark' ? '#F87171' : '#DC2626'}
          />
          <Text
            style={{
              fontSize: 16,
              lineHeight: 24,
              flex: 1,
              color: theme === 'dark' ? '#F87171' : '#DC2626',
            }}
          >
            {strings.delete}
          </Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default CommentOptionsSheetOwner;
