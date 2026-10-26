type AppNotificationType =
  | "system"
  | "entity-comment"
  | "comment-reply"
  | "entity-mention"
  | "comment-mention"
  | "entity-upvote"
  | "comment-upvote"
  | "entity-reaction"
  | "comment-reaction"
  | "entity-reaction-milestone-specific"
  | "entity-reaction-milestone-total"
  | "comment-reaction-milestone-specific"
  | "comment-reaction-milestone-total"
  | "new-follow"
  | "connection-request"
  | "connection-accepted"
  | "space-membership-approved"
  | "event-invite"
  | "event-updated"
  | "event-cancelled"
  | "reputation-grant";

interface BaseAppNotification {
  id: string; // Unique identifier (UUID)
  userId: string; // The recipient's user ID
  type: AppNotificationType; // Type of notification
  isRead: boolean; // Read status
  metadata: Record<string, any>; // Additional data specific to the notification type
  createdAt: string; // ISO timestamp string
}

// User need to sett from dashboard:
// title
// content
// With button? When button does?

export interface SystemNotification extends BaseAppNotification {
  type: "system";
  action: string;
  metadata: {
    title?: string;
    content?: string;
    buttonData: {
      text: string;
      url: string;
    } | null;
  };
}

export interface EntityCommentNotification extends BaseAppNotification {
  type: "entity-comment";
  action: "open-comment";
  metadata: {
    entityId: string;
    entityShortId: string;
    entityTitle: string | null | undefined;
    entityContent: string | null | undefined;

    commentId: string;
    commentContent: string | null | undefined;

    initiatorId: string;
    initiatorName: string | null | undefined;
    initiatorUsername: string | null | undefined;
    initiatorAvatar: string | null | undefined;
  };
}

export interface CommentReplyNotification extends BaseAppNotification {
  type: "comment-reply";
  action: "open-comment";
  metadata: {
    entityId: string;
    entityShortId: string;
    entityTitle: string | null | undefined;
    entityContent: string | null | undefined;

    commentId: string;
    commentContent: string | null | undefined;

    replyId: string;
    replyContent: string | null | undefined;

    initiatorId: string;
    initiatorName: string | null | undefined;
    initiatorUsername: string | null | undefined;
    initiatorAvatar: string | null | undefined;
  };
}

export interface EntityMentionNotification extends BaseAppNotification {
  type: "entity-mention";
  action: "open-entity";
  metadata: {
    entityId: string;
    entityShortId: string;
    entityTitle: string | null | undefined;
    entityContent: string | null | undefined;

    initiatorId: string;
    initiatorName: string | null | undefined;
    initiatorUsername: string | null | undefined;
    initiatorAvatar: string | null | undefined;
  };
}

export interface CommentMentionNotification extends BaseAppNotification {
  type: "comment-mention";
  action: "open-comment";
  metadata: {
    entityId: string;
    entityShortId: string;
    entityTitle: string | null | undefined;
    entityContent: string | null | undefined;

    commentId: string;
    commentContent: string | null | undefined;

    initiatorId: string;
    initiatorName: string | null | undefined;
    initiatorUsername: string | null | undefined;
    initiatorAvatar: string | null | undefined;
  };
}

export interface EntityUpvoteNotification extends BaseAppNotification {
  type: "entity-upvote";
  action: "open-entity";
  metadata: {
    entityId: string;
    entityShortId: string;
    entityTitle: string | null | undefined;
    entityContent: string | null | undefined;

    initiatorId: string;
    initiatorName: string | null | undefined;
    initiatorUsername: string | null | undefined;
    initiatorAvatar: string | null | undefined;
  };
}

export interface CommentUpvoteNotification extends BaseAppNotification {
  type: "comment-upvote";
  action: "open-comment";
  metadata: {
    entityId: string;
    entityShortId: string;
    entityTitle: string | null | undefined;
    entityContent: string | null | undefined;

    commentId: string;
    commentContent: string | null | undefined;

    initiatorId: string;
    initiatorName: string | null | undefined;
    initiatorUsername: string | null | undefined;
    initiatorAvatar: string | null | undefined;
  };
}

export interface EntityReactionNotification extends BaseAppNotification {
  type: "entity-reaction";
  action: "open-entity";
  metadata: {
    entityId: string;
    entityShortId: string;
    entityTitle: string | null | undefined;
    entityContent: string | null | undefined;
    reactionType: string;
    initiatorId: string;
    initiatorName: string | null | undefined;
    initiatorUsername: string | null | undefined;
    initiatorAvatar: string | null | undefined;
  };
}

export interface CommentReactionNotification extends BaseAppNotification {
  type: "comment-reaction";
  action: "open-comment";
  metadata: {
    entityId: string;
    entityShortId: string;
    entityTitle: string | null | undefined;
    entityContent: string | null | undefined;
    commentId: string;
    commentContent: string | null | undefined;
    reactionType: string;
    initiatorId: string;
    initiatorName: string | null | undefined;
    initiatorUsername: string | null | undefined;
    initiatorAvatar: string | null | undefined;
  };
}

interface MilestoneUser {
  id: string;
  name: string | null | undefined;
  username: string | null | undefined;
  avatar: string | null | undefined;
}

export interface EntityReactionMilestoneSpecificNotification extends BaseAppNotification {
  type: "entity-reaction-milestone-specific";
  action: "open-entity";
  metadata: {
    entityId: string;
    entityShortId: string;
    entityTitle: string | null | undefined;
    entityContent: string | null | undefined;
    reactionType: string;
    milestoneCount: number;
    lastThreeUsers: MilestoneUser[];
  };
}

export interface EntityReactionMilestoneTotalNotification extends BaseAppNotification {
  type: "entity-reaction-milestone-total";
  action: "open-entity";
  metadata: {
    entityId: string;
    entityShortId: string;
    entityTitle: string | null | undefined;
    entityContent: string | null | undefined;
    milestoneCount: number;
    reactionCounts: Record<string, number>;
    lastThreeUsers: MilestoneUser[];
  };
}

export interface CommentReactionMilestoneSpecificNotification extends BaseAppNotification {
  type: "comment-reaction-milestone-specific";
  action: "open-comment";
  metadata: {
    entityId: string;
    entityShortId: string;
    entityTitle: string | null | undefined;
    entityContent: string | null | undefined;
    commentId: string;
    commentContent: string | null | undefined;
    reactionType: string;
    milestoneCount: number;
    lastThreeUsers: MilestoneUser[];
  };
}

export interface CommentReactionMilestoneTotalNotification extends BaseAppNotification {
  type: "comment-reaction-milestone-total";
  action: "open-comment";
  metadata: {
    entityId: string;
    entityShortId: string;
    entityTitle: string | null | undefined;
    entityContent: string | null | undefined;
    commentId: string;
    commentContent: string | null | undefined;
    milestoneCount: number;
    reactionCounts: Record<string, number>;
    lastThreeUsers: MilestoneUser[];
  };
}

export interface SpaceMembershipApprovedNotification extends BaseAppNotification {
  type: "space-membership-approved";
  action: "open-space";
  metadata: {
    spaceId: string;
    spaceName: string;
    spaceShortId: string;
    spaceSlug: string | null | undefined;
    spaceAvatar: string | null | undefined;
  };
}

export interface EventInviteNotification extends BaseAppNotification {
  type: "event-invite";
  action: "open-event";
  metadata: {
    eventId: string;
    eventShortId?: string;
    eventTitle: string | null | undefined;
    eventStartTime: string | null | undefined;

    spaceId?: string | null | undefined;
    spaceShortId?: string | null | undefined;
    spaceSlug?: string | null | undefined;

    initiatorId: string;
    initiatorName: string | null | undefined;
    initiatorUsername: string | null | undefined;
    initiatorForeignId?: string | null | undefined;
    initiatorAvatar: string | null | undefined;
  };
}

export interface EventUpdatedNotification extends BaseAppNotification {
  type: "event-updated";
  action: "open-event";
  metadata: {
    eventId: string;
    eventShortId?: string;
    eventTitle: string | null | undefined;
    /** What changed: the event's time, its location, or both. */
    changedFields: ("time" | "location")[];

    spaceId?: string | null | undefined;
    spaceShortId?: string | null | undefined;
    spaceSlug?: string | null | undefined;

    initiatorId: string;
    initiatorName: string | null | undefined;
    initiatorUsername: string | null | undefined;
    initiatorForeignId?: string | null | undefined;
    initiatorAvatar: string | null | undefined;
  };
}

export interface EventCancelledNotification extends BaseAppNotification {
  type: "event-cancelled";
  action: "open-event";
  metadata: {
    eventId: string;
    eventShortId?: string;
    eventTitle: string | null | undefined;

    spaceId?: string | null | undefined;
    spaceShortId?: string | null | undefined;
    spaceSlug?: string | null | undefined;

    initiatorId: string;
    initiatorName: string | null | undefined;
    initiatorUsername: string | null | undefined;
    initiatorForeignId?: string | null | undefined;
    initiatorAvatar: string | null | undefined;
  };
}

export interface ReputationGrantNotification extends BaseAppNotification {
  type: "reputation-grant";
  /**
   * Depends on the grant: the target's action when the grant rewards an
   * entity, comment or message; `open-profile` (the granter) for a user grant
   * with no target; `do-nothing` for an app grant with no target.
   */
  action:
    | "open-entity"
    | "open-comment"
    | "open-message"
    | "open-profile"
    | "do-nothing";
  metadata: {
    grantId: string;
    amount: number;
    /** `"user"`: transferred from another user. `"app"`: granted by the app. */
    sourceType: "user" | "app";
    note?: string | null | undefined;

    // The user who gave the reputation. Absent or null for an app grant.
    granterId?: string | null | undefined;
    granterName?: string | null | undefined;
    granterUsername?: string | null | undefined;
    granterForeignId?: string | null | undefined;
    granterAvatar?: string | null | undefined;

    // The space the reputation is in; null for project-wide reputation.
    spaceId?: string | null | undefined;
    spaceShortId?: string | null | undefined;
    spaceSlug?: string | null | undefined;

    // The rewarded item, when there is one.
    targetType?: "entity" | "comment" | "message" | null | undefined;
    targetId?: string | null | undefined;
    entityId?: string | null | undefined;
    entityShortId?: string | null | undefined;
    entityForeignId?: string | null | undefined;
    commentId?: string | null | undefined;
    commentForeignId?: string | null | undefined;
    messageId?: string | null | undefined;
    conversationId?: string | null | undefined;
  };
}

export interface NewFollowNotification extends BaseAppNotification {
  type: "new-follow";
  action: "open-profile";
  metadata: {
    initiatorId: string;
    initiatorName: string | null | undefined;
    initiatorUsername: string | null | undefined;
    initiatorAvatar: string | null | undefined;
  };
}

export interface ConnectionRequestNotification extends BaseAppNotification {
  type: "connection-request";
  action: "open-profile";
  metadata: {
    connectionId: string;
    initiatorId: string;
    initiatorName: string | null | undefined;
    initiatorUsername: string | null | undefined;
    initiatorAvatar: string | null | undefined;
  };
}

export interface ConnectionAcceptedNotification extends BaseAppNotification {
  type: "connection-accepted";
  action: "open-profile";
  metadata: {
    connectionId: string;
    initiatorId: string;
    initiatorName: string | null | undefined;
    initiatorUsername: string | null | undefined;
    initiatorAvatar: string | null | undefined;
  };
}

// export interface FollowRequestNotification extends BaseAppNotification {
//   type: "followRequest";
//   metadata: {
//     requesterId: string;
//   };
// }

// export interface FollowRequestAcceptedNotification extends BaseAppNotification {
//   type: "followRequestAccepted";
//   metadata: {
//     followerId: string;
//   };
// }

// export interface FriendRequestNotification extends BaseAppNotification {
//   type: "friendRequest";
//   metadata: {
//     requesterId: string;
//   };
// }

// export interface FriendRequestAcceptedNotification extends BaseAppNotification {
//   type: "friendRequestAccepted";
//   metadata: {
//     friendId: string;
//   };
// }

// export interface PostShareNotification extends BaseAppNotification {
//   type: "postShare";
//   metadata: {
//     postId: string;
//     sharerId: string;
//   };
// }

// export interface EventInviteNotification extends BaseAppNotification {
//   type: "eventInvite";
//   metadata: {
//     eventId: string;
//     inviterId: string;
//   };
// }

// export interface GroupInviteNotification extends BaseAppNotification {
//   type: "groupInvite";
//   metadata: {
//     groupId: string;
//     inviterId: string;
//   };
// }

// export interface GroupJoinRequestNotification extends BaseAppNotification {
//   type: "groupJoinRequest";
//   metadata: {
//     groupId: string;
//     requesterId: string;
//   };
// }

// export interface GroupJoinRequestApprovedNotification
//   extends BaseAppNotification {
//   type: "groupJoinRequestApproved";
//   metadata: {
//     groupId: string;
//     approverId: string;
//   };
// }

// export interface SystemNotification extends BaseAppNotification {
//   type: "system";
//   metadata: {
//     message: string;
//   };
// }

// export interface CustomNotification extends BaseAppNotification {
//   type: "custom";
//   metadata: Record<string, any>; // Flexible metadata for custom notifications
// }

export type UnifiedAppNotification =
  | SystemNotification
  | EntityCommentNotification
  | CommentReplyNotification
  | EntityMentionNotification
  | CommentMentionNotification
  | EntityUpvoteNotification
  | CommentUpvoteNotification
  | EntityReactionNotification
  | CommentReactionNotification
  | EntityReactionMilestoneSpecificNotification
  | EntityReactionMilestoneTotalNotification
  | CommentReactionMilestoneSpecificNotification
  | CommentReactionMilestoneTotalNotification
  | NewFollowNotification
  | ConnectionRequestNotification
  | ConnectionAcceptedNotification
  | SpaceMembershipApprovedNotification
  | EventInviteNotification
  | EventUpdatedNotification
  | EventCancelledNotification
  | ReputationGrantNotification;

export type PotentiallyPopulatedUnifiedAppNotification =
  UnifiedAppNotification & {
    title?: string;
    content?: string;
  };
