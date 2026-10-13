import { View, Text, Pressable } from "react-native";
import { useCallback, useMemo, useState } from "react";
import {
  handleError,
  ReportReasonKey,
  useUser,
  useCommentSection,
  useCreateReport,
} from "@sublay/react-native";
import FlagIcon from "~shared/react-native/flag-icon";
import CustomButton from "~shared/react-native/custom-button";

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import useUIState from "../../hooks/use-ui-state";
import strings from "../../utils/strings";

const ReportCommentSheet = () => {
  const { user } = useUser();
  const { callbacks } = useCommentSection();
  const {
    reportCommentSheetRef,
    reportedComment,
    setReportedComment,
    closeReportCommentSheet,
    theme,
  } = useUIState();
  const createCommentReport = useCreateReport({ type: "comment" });

  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState<ReportReasonKey | null>(null);
  const snapPoints = useMemo(() => ["100%"], []);

  const buttonActive = useMemo(
    () => !!reason && !!reportedComment,
    [reason, reportedComment]
  );

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

  const handleSubmitReport = async () => {
    try {
      if (!reportedComment) throw new Error("No comment to report selected");
      if (!reason) throw new Error("No reason to report selected");
      if (!user) {
        callbacks?.loginRequiredCallback?.();
        return;
      }
      if (!user.username && callbacks?.usernameRequiredCallback) {
        callbacks.usernameRequiredCallback();
        return;
      }
      setSubmitting(true);
      await createCommentReport({ targetId: reportedComment.id, reason });
      closeReportCommentSheet?.();
      setReportedComment?.(null);
      setReason(null);
    } catch (err) {
      handleError(err, "Submitting report failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      ref={reportCommentSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onChange={(state) => {
        if (state === -1) {
          setReportedComment?.(null);
        }
      }}
      backgroundStyle={{
        backgroundColor: theme === 'dark' ? '#262626' : '#FFFFFF',
      }}
      handleIndicatorStyle={{
        backgroundColor: theme === 'dark' ? '#A3A3A3' : '#D1D5DB',
      }}
    >
      <BottomSheetView className="p-7 flex-1 h-full justify-between">
        <View>
          <View className="flex-row items-center gap-4">
            <FlagIcon
              size={24}
              color={theme === 'dark' ? '#FAFAFA' : '#1F2937'}
            />
            <Text
              className={`text-2xl ${
                theme === 'dark' ? 'text-neutral-50' : 'text-gray-900'
              }`}
            >
              {strings.reportTitle}
            </Text>
          </View>
          <Text
            className={`mt-6 ${
              theme === 'dark' ? 'text-neutral-300' : 'text-gray-700'
            }`}
          >
            {strings.reportIntro}
          </Text>

          <View className="flex-row flex-wrap gap-1.5 mt-6">
            {Object.entries(strings.reportReasons).map(([key, value], index) => {
              const isSelected = key === reason;
              return (
                <Pressable
                  onPress={() => setReason(key as ReportReasonKey)}
                  key={index}
                  className={`px-2 py-1 rounded-md ${
                    isSelected
                      ? theme === 'dark'
                        ? 'bg-white'
                        : 'bg-gray-900'
                      : theme === 'dark'
                        ? 'bg-neutral-600'
                        : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      isSelected
                        ? theme === 'dark'
                          ? 'text-neutral-900'
                          : 'text-white'
                        : theme === 'dark'
                          ? 'text-neutral-400'
                          : 'text-gray-500'
                    }`}
                  >
                    {value}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <CustomButton
          text={strings.submitReport}
          activeText={strings.submittingReport}
          onPress={handleSubmitReport}
          disabled={!buttonActive}
          submitting={submitting}
        />
      </BottomSheetView>
    </BottomSheet>
  );
};

export default ReportCommentSheet;
