import useAxiosPrivate from "../../config/useAxiosPrivate";
import { ReportReasonKey } from "../../constants/reportReasons";
import useProject from "../projects/useProject";
import { useUser } from "../user";

export type ReportTargetType = "comment" | "entity" | "message";

export interface UseCreateReportProps {
  type: ReportTargetType;
}

export interface CreateReportProps {
  targetId: string;
  targetType: ReportTargetType;
  reason: ReportReasonKey;
  details?: string;
}

export interface CreateCommentReportProps {
  targetId: string;
  reason: ReportReasonKey;
  details?: string;
}

export interface CreateEntityReportProps {
  targetId: string;
  reason: ReportReasonKey;
  details?: string;
}

/**
 * `targetId` is the message id. The conversation is resolved server-side, so
 * no conversationId is needed. The reporter must be a member of the
 * conversation, and may not report their own message.
 */
export interface CreateMessageReportProps {
  targetId: string;
  reason: ReportReasonKey;
  details?: string;
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

function useCreateReport({ type }: UseCreateReportProps):
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

  if (type === "comment") {
    return createCommentReport;
  } else if (type === "entity") {
    return createEntityReport;
  } else if (type === "message") {
    return createMessageReport;
  }

  throw new Error("Invalid report type");
}

export default useCreateReport;
