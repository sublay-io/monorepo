import useAxiosPrivate from "../../config/useAxiosPrivate";
import { ReportReasonKey } from "../../constants/reportReasons";
import { ReportTargetType } from "../../interfaces/models/Report";
import useProject from "../projects/useProject";
import { useUser } from "../user";

export interface UseCreateReportProps {
  targetType: ReportTargetType;
}

export interface CreateReportProps {
  targetId: string;
  targetType: ReportTargetType;
  reason: ReportReasonKey;
  details?: string | null;
}

export interface CreateCommentReportProps {
  targetId: string;
  reason: ReportReasonKey;
  details?: string | null;
}

export interface CreateEntityReportProps {
  targetId: string;
  reason: ReportReasonKey;
  details?: string | null;
}

/**
 * `targetId` is the message id. The conversation is resolved server-side, so
 * no conversationId is needed. The reporter must be a member of the
 * conversation, and may not report their own message.
 */
export interface CreateMessageReportProps {
  targetId: string;
  reason: ReportReasonKey;
  details?: string | null;
}

/**
 * The caller's own report, as `POST /reports` returns it: 201 when this call
 * files it (including joining a target someone else already reported), 200
 * with the same record when the caller already has an open report on the
 * target. It is the reporter's submission only — never the shared,
 * moderator-facing report.
 */
export interface CreateReportResponse {
  id: string;
  targetId: string;
  targetType: ReportTargetType;
  reason: ReportReasonKey;
  details: string | null;
  createdAt: string;
}

function useCreateReport({ targetType: reportType }: UseCreateReportProps):
  | ((props: CreateCommentReportProps) => Promise<CreateReportResponse>)
  | ((props: CreateEntityReportProps) => Promise<CreateReportResponse>)
  | ((props: CreateMessageReportProps) => Promise<CreateReportResponse>) {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const createReport = async ({
    targetId,
    targetType,
    reason,
    details,
  }: CreateReportProps): Promise<CreateReportResponse> => {
    if (!projectId) {
      throw new Error("Project ID is required");
    }

    if (!user) {
      throw new Error("No user is logged in");
    }

    const response = await axios.post<CreateReportResponse>(
      `/${projectId}/reports`,
      {
        targetId,
        targetType,
        reason,
        details,
      },
    );
    return response.data;
  };

  const createCommentReport = async ({
    targetId,
    reason,
    details,
  }: CreateCommentReportProps) => {
    return createReport({
      targetId,
      targetType: "comment",
      reason,
      details,
    });
  };

  const createEntityReport = async ({
    targetId,
    reason,
    details,
  }: CreateEntityReportProps) => {
    return createReport({
      targetId,
      targetType: "entity",
      reason,
      details,
    });
  };

  const createMessageReport = async ({
    targetId,
    reason,
    details,
  }: CreateMessageReportProps) => {
    return createReport({
      targetId,
      targetType: "message",
      reason,
      details,
    });
  };

  if (reportType === "comment") {
    return createCommentReport;
  } else if (reportType === "entity") {
    return createEntityReport;
  } else if (reportType === "message") {
    return createMessageReport;
  }

  throw new Error("Invalid report type");
}

export default useCreateReport;
