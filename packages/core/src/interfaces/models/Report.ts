import { EntityRecord } from "./Entity";
import { Comment } from "./Comment";
import { ChatMessage } from "./ChatMessage";
import { Space } from "./Space";
import { User } from "./User";
import { ReportReasonKey } from "../../constants/reportReasons";

export type ReportTargetType = "comment" | "entity" | "message";

/**
 * The reasons the API accepts on a report. Server-enforced — anything outside
 * this set is rejected with `report/invalid-body`. Use `other` plus `details`
 * for anything the taxonomy doesn't cover.
 */
export type ReportReason = ReportReasonKey;

export type ReportStatus =
  | "pending"
  | "on-hold"
  | "escalated"
  | "dismissed"
  | "actioned"
  // Closed by the system with no moderator decision; the reason is in
  // actionTaken (e.g. the content was deleted by its author).
  | "auto-closed";

export interface UserReport {
  id: string;
  reportId: string;
  userId: string;
  reason: ReportReason;
  details: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A reported entity as the moderation queue returns it: the stored record and its author. */
export type ReportEntityTarget = EntityRecord & { user: User | null };

/** A reported comment as the moderation queue returns it: the stored record and its author. */
export type ReportCommentTarget = Omit<
  Comment,
  | "entity"
  | "user"
  | "parentComment"
  | "userReaction"
  | "repliesCount"
  | "grants"
  | "isAuthorBlocked"
  | "isUnavailable"
  | "replies"
  | "metadata"
> & {
  metadata: Record<string, any>;
  user: User | null;
};

/** A reported chat message as the moderation queue returns it: the stored record and its sender. */
export type ReportMessageTarget = Omit<
  ChatMessage,
  | "files"
  | "reactionCounts"
  | "userReactions"
  | "grants"
  | "quotedMessage"
  | "user"
  | "metadata"
  | "localId"
  | "sendFailed"
> & {
  metadata: Record<string, any>;
  user: User | null;
};

/** The space a report was filed in, as the moderation queue returns it: the stored record. */
export type ReportSpace = Omit<
  Space,
  "membersCount" | "childSpacesCount" | "isMember" | "avatarFile" | "bannerFile"
>;

interface ReportBase {
  id: string;
  spaceId: string | null;
  targetId: string;
  status: ReportStatus;
  reporterCount: number;
  actionTaken: string | null; // What the moderator (or the system, on auto-close) did
  createdAt: string;
  updatedAt: string;
  userReports: UserReport[];
  space: ReportSpace | null; // The space the report was filed in
}

/**
 * A report in the moderation queue. `target` is the reported content, typed by
 * `targetType`; `null` when it can no longer be found.
 */
export type Report =
  | (ReportBase & { targetType: "entity"; target: ReportEntityTarget | null })
  | (ReportBase & { targetType: "comment"; target: ReportCommentTarget | null })
  | (ReportBase & { targetType: "message"; target: ReportMessageTarget | null });
