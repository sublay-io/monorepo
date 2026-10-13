import { useMemo, useState } from "react";
import {
  handleError,
  ReportReasonKey,
  useCommentSection,
  useCreateReport,
  useUser,
} from "@sublay/react-js";
import FlagIcon from "~shared/react/flag-icon";
import useUIState from "../../../hooks/use-ui-state";
import { cn } from "@/lib/utils";
import strings from "../../../utils/strings";

function ReportContent({ resetView }: { resetView: () => void }) {
  const { user } = useUser();
  const { callbacks } = useCommentSection();
  const { optionsComment, closeCommentOptionsModal } = useUIState();
  const createCommentReport = useCreateReport({ type: "comment" });

  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState<ReportReasonKey | null>(null);

  const buttonActive = useMemo(
    () => !!reason && !!optionsComment,
    [reason, optionsComment]
  );

  const handleSubmitReport = async () => {
    try {
      if (!optionsComment) throw new Error("No comment to report selected");
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
      await createCommentReport({ targetId: optionsComment.id, reason });
      closeCommentOptionsModal?.();
      setReason(null);
      resetView();
    } catch (err) {
      handleError(err, "Submitting report failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 w-full">
      <div className="flex items-center gap-4 text-gray-900 dark:text-neutral-50">
        <FlagIcon size={24} color="currentColor" />
        <span className="text-2xl text-gray-900 dark:text-neutral-50">{strings.reportTitle}</span>
      </div>
      <p className="mt-6 text-gray-700 dark:text-neutral-300">
        {strings.reportIntro}
      </p>

      <div className="flex flex-wrap gap-1.5 mt-6">
        {Object.entries(strings.reportReasons).map(([key, value], index) => (
          <button
            onClick={() => setReason(key as ReportReasonKey)}
            key={index}
            className={cn(
              "px-2 py-1 rounded-md cursor-pointer text-sm",
              key === reason
                ? "bg-gray-900 dark:bg-white text-white dark:text-neutral-900"
                : "bg-gray-200 dark:bg-neutral-600 text-gray-500 dark:text-neutral-400"
            )}
          >
            {value}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmitReport}
        disabled={!buttonActive}
        className={cn(
          "w-full mt-4",
          "inline-flex items-center justify-center",
          "px-4 py-2",
          "text-sm font-medium leading-5",
          "rounded-md",
          "transition-colors duration-200",
          buttonActive
            ? "bg-gray-900 dark:bg-white text-white dark:text-neutral-900 cursor-pointer"
            : "bg-gray-200 dark:bg-neutral-600 text-gray-500 dark:text-neutral-500 cursor-not-allowed"
        )}
      >
        {submitting ? strings.submittingReport : strings.submitReport}
      </button>
    </div>
  );
}

export default ReportContent;
