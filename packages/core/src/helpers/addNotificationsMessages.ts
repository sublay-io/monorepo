import {
  CommentMentionTemplateVars,
  CommentReactionMilestoneSpecificTemplateVars,
  CommentReactionMilestoneTotalTemplateVars,
  CommentReactionTemplateVars,
  CommentReplyTemplateVars,
  CommentUpvoteTemplateVars,
  ConnectionAcceptedTemplateVars,
  ConnectionRequestTemplateVars,
  SpaceMembershipApprovedTemplateVars,
  SpaceMemberAddedTemplateVars,
  EventInviteTemplateVars,
  EventUpdatedTemplateVars,
  EventCancelledTemplateVars,
  ReputationGrantTemplateVars,
  EntityCommentTemplateVars,
  EntityMentionTemplateVars,
  EntityReactionMilestoneSpecificTemplateVars,
  EntityReactionMilestoneTotalTemplateVars,
  EntityReactionTemplateVars,
  EntityUpvoteTemplateVars,
  NewFollowTemplateVars,
  NotificationTemplates,
  PotentiallyPopulatedUnifiedAppNotification,
  TemplateField,
  TypedNotificationTemplate,
} from "../interfaces/models/AppNotification";
import { getUserName } from "./getUserName";

// Utility function to replace $variable placeholders in a template string
const replaceTemplateVariables = (
  template: string,
  variables: Record<string, string>
): string => {
  return Object.entries(variables).reduce(
    (result, [key, value]) =>
      result.replace(new RegExp(`\\$${key}`, "g"), value),
    template
  );
};

// Resolves a template field: calls the function with vars, or replaces placeholders in the string.
// Falls back to the default string template when no custom field is provided.
const resolveField = <TVars>(
  field: TemplateField<TVars> | undefined,
  defaultTemplate: string,
  vars: TVars
): string => {
  if (field === undefined) {
    return replaceTemplateVariables(defaultTemplate, vars as Record<string, string>);
  }
  if (typeof field === "function") {
    return field(vars);
  }
  return replaceTemplateVariables(field, vars as Record<string, string>);
};

const configureMessage = <TVars>(
  vars: TVars,
  defaultTitleTemplate: string,
  defaultContentTemplate: string,
  notificationTemplate?: TypedNotificationTemplate<TVars>
): { title: string; content: string } => {
  const title = resolveField(
    notificationTemplate?.title,
    defaultTitleTemplate,
    vars
  );
  const content = resolveField(
    notificationTemplate?.content,
    defaultContentTemplate,
    vars
  );
  return { title: title.trim(), content: content.trim() };
};

// Builds initiator name/username from notification metadata
const getInitiatorVars = (
  notification: any
): { initiatorName: string; initiatorUsername: string } => ({
  initiatorName: getUserName(
    {
      id: notification.metadata.initiatorId,
      name: notification.metadata.initiatorName,
      username: notification.metadata.initiatorUsername,
    },
    "name"
  ),
  initiatorUsername: getUserName(
    {
      id: notification.metadata.initiatorId,
      name: notification.metadata.initiatorName,
      username: notification.metadata.initiatorUsername,
    },
    "username"
  ),
});

// Main notification mapping logic
export default (
  notifications: PotentiallyPopulatedUnifiedAppNotification[],
  notificationTemplates?: Partial<NotificationTemplates>
): PotentiallyPopulatedUnifiedAppNotification[] => {
  return notifications.map((notification) => {
    if (notification.title) return notification;

    let title = "";
    let content: string | null | undefined;

    switch (notification.type) {
      case "system":
        title = notification.metadata.title || "System message";
        content =
          notification.metadata.content || "You have a new system message";
        break;

      case "entity-comment": {
        const vars: EntityCommentTemplateVars = {
          ...getInitiatorVars(notification),
          entityTitle: notification.metadata.entityTitle || "",
          entityContent: notification.metadata.entityContent || "",
          commentContent: notification.metadata.commentContent || "",
        };
        ({ title, content } = configureMessage(
          vars,
          `$initiatorUsername commented on your post`,
          `$commentContent`,
          notificationTemplates?.entityComment
        ));
        break;
      }

      case "comment-reply": {
        const vars: CommentReplyTemplateVars = {
          ...getInitiatorVars(notification),
          entityTitle: notification.metadata.entityTitle || "",
          entityContent: notification.metadata.entityContent || "",
          commentContent: notification.metadata.commentContent || "",
          replyContent: notification.metadata.replyContent || "",
        };
        ({ title, content } = configureMessage(
          vars,
          `$initiatorUsername replied to your comment`,
          `$replyContent`,
          notificationTemplates?.commentReply
        ));
        break;
      }

      case "entity-mention": {
        const vars: EntityMentionTemplateVars = {
          ...getInitiatorVars(notification),
          entityTitle: notification.metadata.entityTitle || "",
          entityContent: notification.metadata.entityContent || "",
        };
        ({ title, content } = configureMessage(
          vars,
          `$initiatorUsername mentioned you in their post`,
          `$entityTitle`,
          notificationTemplates?.entityMention
        ));
        break;
      }

      case "comment-mention": {
        const vars: CommentMentionTemplateVars = {
          ...getInitiatorVars(notification),
          entityTitle: notification.metadata.entityTitle || "",
          entityContent: notification.metadata.entityContent || "",
          commentContent: notification.metadata.commentContent || "",
        };
        ({ title, content } = configureMessage(
          vars,
          `$initiatorUsername mentioned you in their comment`,
          `$commentContent`,
          notificationTemplates?.commentMention
        ));
        break;
      }

      case "entity-upvote": {
        const vars: EntityUpvoteTemplateVars = {
          ...getInitiatorVars(notification),
          entityTitle: notification.metadata.entityTitle || "",
          entityContent: notification.metadata.entityContent || "",
        };
        ({ title, content } = configureMessage(
          vars,
          `$initiatorUsername upvoted your post`,
          ``,
          notificationTemplates?.entityUpvote
        ));
        break;
      }

      case "comment-upvote": {
        const vars: CommentUpvoteTemplateVars = {
          ...getInitiatorVars(notification),
          entityTitle: notification.metadata.entityTitle || "",
          entityContent: notification.metadata.entityContent || "",
          commentContent: notification.metadata.commentContent || "",
        };
        ({ title, content } = configureMessage(
          vars,
          `$initiatorUsername upvoted your comment`,
          `$commentContent`,
          notificationTemplates?.commentUpvote
        ));
        break;
      }

      case "new-follow": {
        const vars: NewFollowTemplateVars = {
          ...getInitiatorVars(notification),
        };
        ({ title, content } = configureMessage(
          vars,
          `$initiatorUsername started following you`,
          ``,
          notificationTemplates?.newFollow
        ));
        break;
      }

      case "entity-reaction": {
        const vars: EntityReactionTemplateVars = {
          ...getInitiatorVars(notification),
          entityTitle: notification.metadata.entityTitle || "",
          entityContent: notification.metadata.entityContent || "",
          reactionType: notification.metadata.reactionType || "",
        };
        ({ title, content } = configureMessage(
          vars,
          `$initiatorUsername reacted $reactionType to your post`,
          ``,
          notificationTemplates?.entityReaction
        ));
        break;
      }

      case "comment-reaction": {
        const vars: CommentReactionTemplateVars = {
          ...getInitiatorVars(notification),
          entityTitle: notification.metadata.entityTitle || "",
          entityContent: notification.metadata.entityContent || "",
          commentContent: notification.metadata.commentContent || "",
          reactionType: notification.metadata.reactionType || "",
        };
        ({ title, content } = configureMessage(
          vars,
          `$initiatorUsername reacted $reactionType to your comment`,
          `$commentContent`,
          notificationTemplates?.commentReaction
        ));
        break;
      }

      case "entity-reaction-milestone-specific": {
        const vars: EntityReactionMilestoneSpecificTemplateVars = {
          entityTitle: notification.metadata.entityTitle || "",
          entityContent: notification.metadata.entityContent || "",
          reactionType: notification.metadata.reactionType || "",
          milestoneCount: notification.metadata.milestoneCount?.toString() || "",
        };
        ({ title, content } = configureMessage(
          vars,
          `Your post reached $milestoneCount $reactionType reactions`,
          ``,
          notificationTemplates?.entityReactionMilestoneSpecific
        ));
        break;
      }

      case "entity-reaction-milestone-total": {
        const vars: EntityReactionMilestoneTotalTemplateVars = {
          entityTitle: notification.metadata.entityTitle || "",
          entityContent: notification.metadata.entityContent || "",
          milestoneCount: notification.metadata.milestoneCount?.toString() || "",
        };
        ({ title, content } = configureMessage(
          vars,
          `Your post reached $milestoneCount reactions`,
          ``,
          notificationTemplates?.entityReactionMilestoneTotal
        ));
        break;
      }

      case "comment-reaction-milestone-specific": {
        const vars: CommentReactionMilestoneSpecificTemplateVars = {
          entityTitle: notification.metadata.entityTitle || "",
          entityContent: notification.metadata.entityContent || "",
          commentContent: notification.metadata.commentContent || "",
          reactionType: notification.metadata.reactionType || "",
          milestoneCount: notification.metadata.milestoneCount?.toString() || "",
        };
        ({ title, content } = configureMessage(
          vars,
          `Your comment reached $milestoneCount $reactionType reactions`,
          `$commentContent`,
          notificationTemplates?.commentReactionMilestoneSpecific
        ));
        break;
      }

      case "comment-reaction-milestone-total": {
        const vars: CommentReactionMilestoneTotalTemplateVars = {
          entityTitle: notification.metadata.entityTitle || "",
          entityContent: notification.metadata.entityContent || "",
          commentContent: notification.metadata.commentContent || "",
          milestoneCount: notification.metadata.milestoneCount?.toString() || "",
        };
        ({ title, content } = configureMessage(
          vars,
          `Your comment reached $milestoneCount reactions`,
          `$commentContent`,
          notificationTemplates?.commentReactionMilestoneTotal
        ));
        break;
      }

      case "connection-request": {
        const vars: ConnectionRequestTemplateVars = {
          ...getInitiatorVars(notification),
        };
        ({ title, content } = configureMessage(
          vars,
          `$initiatorUsername sent you a connection request`,
          ``,
          notificationTemplates?.connectionRequest
        ));
        break;
      }

      case "connection-accepted": {
        const vars: ConnectionAcceptedTemplateVars = {
          ...getInitiatorVars(notification),
        };
        ({ title, content } = configureMessage(
          vars,
          `$initiatorUsername accepted your connection request`,
          ``,
          notificationTemplates?.connectionAccepted
        ));
        break;
      }

      case "space-membership-approved": {
        const vars: SpaceMembershipApprovedTemplateVars = {
          spaceName: notification.metadata.spaceName || "",
          spaceShortId: notification.metadata.spaceShortId || "",
          spaceSlug: notification.metadata.spaceSlug || "",
        };
        ({ title, content } = configureMessage(
          vars,
          `Your request to join $spaceName has been approved`,
          ``,
          notificationTemplates?.spaceMembershipApproved
        ));
        break;
      }

      case "space-member-added": {
        const vars: SpaceMemberAddedTemplateVars = {
          spaceName: notification.metadata.spaceName || "",
          spaceShortId: notification.metadata.spaceShortId || "",
          spaceSlug: notification.metadata.spaceSlug || "",
        };
        ({ title, content } = configureMessage(
          vars,
          `You were added to $spaceName`,
          ``,
          notificationTemplates?.spaceMemberAdded
        ));
        break;
      }

      case "event-invite": {
        const vars: EventInviteTemplateVars = {
          ...getInitiatorVars(notification),
          eventTitle: notification.metadata.eventTitle || "",
        };
        ({ title, content } = configureMessage(
          vars,
          `$initiatorUsername invited you to $eventTitle`,
          ``,
          notificationTemplates?.eventInvite
        ));
        break;
      }

      case "event-updated": {
        const vars: EventUpdatedTemplateVars = {
          ...getInitiatorVars(notification),
          eventTitle: notification.metadata.eventTitle || "",
        };
        ({ title, content } = configureMessage(
          vars,
          `$eventTitle was updated`,
          ``,
          notificationTemplates?.eventUpdated
        ));
        break;
      }

      case "event-cancelled": {
        const vars: EventCancelledTemplateVars = {
          ...getInitiatorVars(notification),
          eventTitle: notification.metadata.eventTitle || "",
        };
        ({ title, content } = configureMessage(
          vars,
          `$eventTitle was cancelled`,
          ``,
          notificationTemplates?.eventCancelled
        ));
        break;
      }

      case "reputation-grant": {
        const { metadata } = notification;
        const granter = {
          id: metadata.granterId ?? "",
          name: metadata.granterName,
          username: metadata.granterUsername,
        };
        const vars: ReputationGrantTemplateVars = {
          amount: String(metadata.amount),
          granterName: metadata.granterId ? getUserName(granter, "name") : "",
          granterUsername: metadata.granterId
            ? getUserName(granter, "username")
            : "",
          note: metadata.note || "",
        };
        ({ title, content } = configureMessage(
          vars,
          `You received $amount reputation`,
          `$note`,
          notificationTemplates?.reputationGrant
        ));
        break;
      }

      default:
        break;
    }

    return {
      ...notification,
      title,
      content,
    } as PotentiallyPopulatedUnifiedAppNotification;
  });
};
