import { Entity } from "./Entity";
import { Comment } from "./Comment";
import { Space } from "./Space";

export type ReportTargetType = "entity" | "comment" | "message";

/**
 * The reasons the API accepts on a report. Server-enforced — anything outside
 * this set is rejected with `report/invalid-body`. Use `other` plus `details`
 * for anything the taxonomy doesn't cover.
 */
export type ReportReason =
  | "spam"
  | "inappropriateContent"
  | "harassment"
  | "misinformation"
  | "hateSpeech"
  | "violence"
  | "illegalActivity"
  | "selfHarm"
  | "other";
export type ReportStatus =
  | "pending"
  | "on-hold"
  | "escalated"
  | "dismissed"
  | "actioned";

export interface UserReport {
  id: string;
  projectId: string;
  reportId: string;
  userId: string;
  reason: string;
  details: string | null;
  createdAt: string;
}

export interface Report {
  id: string;
  projectId: string;
  spaceId: string | null;
  targetId: string;
  targetType: ReportTargetType;
  status: ReportStatus;
  reporterCount: number;
  createdAt: string;
  updatedAt: string;
  userReports?: UserReport[];
  // Populated when fetched via fetchModeratedReports
  target?: Entity | Comment | null;
  space?: Space | null;
}

/**
 * What `POST /reports` returns: the caller's own report of the target (201 when
 * this call made it, 200 when the caller already has an open report of that
 * target). `id` is the caller's report record, not the shared report that
 * moderators see.
 */
export interface CreateReportResponse {
  id: string;
  targetId: string;
  targetType: ReportTargetType;
  reason: ReportReason;
  details: string | null;
  createdAt: string;
}
