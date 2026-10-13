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
      <BottomSheetView
        style={{
          padding: 28,
          flex: 1,
          height: '100%',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <FlagIcon
              size={24}
              color={theme === 'dark' ? '#FAFAFA' : '#1F2937'}
            />
            <Text
              style={{
                fontSize: 24,
                lineHeight: 32,
                color: theme === 'dark' ? '#FAFAFA' : '#111827',
              }}
            >
              {strings.reportTitle}
            </Text>
          </View>
          <Text
            style={{
              marginTop: 24,
              color: theme === 'dark' ? '#D4D4D4' : '#374151',
            }}
          >
            {strings.reportIntro}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 6,
              marginTop: 24,
            }}
          >
            {Object.entries(strings.reportReasons).map(([key, value], index) => {
              const isSelected = key === reason;
              return (
                <Pressable
                  onPress={() => setReason(key as ReportReasonKey)}
                  key={index}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    // 🎨 CUSTOMIZATION: Reason chip background (selected / not selected)
                    backgroundColor: isSelected
                      ? theme === 'dark' ? '#FFFFFF' : '#111827'
                      : theme === 'dark' ? '#525252' : '#E5E7EB',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      lineHeight: 20,
                      color: isSelected
                        ? theme === 'dark' ? '#171717' : '#FFFFFF'
                        : theme === 'dark' ? '#A3A3A3' : '#6B7280',
                    }}
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
