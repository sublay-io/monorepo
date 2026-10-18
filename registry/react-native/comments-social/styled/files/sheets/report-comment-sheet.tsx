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
        backgroundColor: theme === 'dark' ? '#262626' : '#18181B',
      }}
      handleIndicatorStyle={{
        backgroundColor: theme === 'dark' ? '#FAFAFA' : '#fff',
      }}
    >
      <BottomSheetView
        style={{
          padding: 24.5,
          flex: 1,
          height: "100%",
          justifyContent: "space-between",
        }}
      >
        <View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
            }}
          >
            <FlagIcon
              size={24}
              color={theme === 'dark' ? '#FAFAFA' : '#e5e7eb'}
            />
            <Text style={{
              fontSize: 21,
              lineHeight: 28,
              color: theme === 'dark' ? '#FAFAFA' : '#e5e7eb',
            }}>
              {strings.reportTitle}
            </Text>
          </View>
          <Text
            style={{
              color: theme === 'dark' ? '#FAFAFA' : '#e5e7eb',
              marginTop: 21,
            }}
          >
            {strings.reportIntro}
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10.5,
              marginTop: 21,
            }}
          >
            {Object.entries(strings.reportReasons).map(([key, value], index) => (
              <Pressable
                onPress={() => setReason(key as ReportReasonKey)}
                key={index}
                style={{
                  borderWidth: 1,
                  borderColor: theme === 'dark' ? '#525252' : '#e5e7eb',
                  paddingHorizontal: 14,
                  paddingVertical: 8.75,
                  borderRadius: 10.5,
                  backgroundColor: key === reason
                    ? (theme === 'dark' ? '#404040' : '#f9fafb')
                    : "transparent",
                }}
              >
                <Text
                  style={{
                    color: key === reason
                      ? (theme === 'dark' ? '#FAFAFA' : '#1f2937')
                      : (theme === 'dark' ? '#A3A3A3' : '#e5e7eb'),
                  }}
                >
                  {value}
                </Text>
              </Pressable>
            ))}
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
