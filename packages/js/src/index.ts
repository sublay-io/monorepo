import {
  SublayHttpClient,
  ClientConfig,
  AuthTokens,
} from "./core/client";
import * as Auth from "./modules/auth";
import * as Users from "./modules/users";
import * as Entities from "./modules/entities";
import * as Events from "./modules/events";
import * as Comments from "./modules/comments";
import * as Spaces from "./modules/spaces";
import * as Collections from "./modules/collections";
import * as Follows from "./modules/follows";
import * as Connections from "./modules/connections";
import * as AppNotifications from "./modules/app-notifications";
import * as Reports from "./modules/reports";
import * as Reputation from "./modules/reputation";
import * as Search from "./modules/search";
import * as Storage from "./modules/storage";
import * as OAuth from "./modules/oauth";
import * as Chat from "./modules/chat";
import * as Push from "./modules/push";
import * as Workspaces from "./modules/workspaces";
import { createTableAccessor } from "./modules/tables";
import { TableAccessor, TableRow } from "./interfaces/Table";

type BoundModule<
  T extends Record<string, (client: SublayHttpClient, ...args: any[]) => any>
> = {
  [K in keyof T]: (
    ...args: Parameters<T[K]> extends [any, ...infer R] ? R : never
  ) => ReturnType<T[K]>;
};

export class SublayClient {
  private http: SublayHttpClient;

  public auth: BoundModule<typeof Auth>;
  public users: BoundModule<typeof Users>;
  public entities: BoundModule<typeof Entities>;
  public events: BoundModule<typeof Events>;
  public comments: BoundModule<typeof Comments>;
  public spaces: BoundModule<typeof Spaces>;
  public collections: BoundModule<typeof Collections>;
  public follows: BoundModule<typeof Follows>;
  public connections: BoundModule<typeof Connections>;
  public appNotifications: BoundModule<typeof AppNotifications>;
  public reports: BoundModule<typeof Reports>;
  public reputation: BoundModule<typeof Reputation>;
  public search: BoundModule<typeof Search>;
  public storage: BoundModule<typeof Storage>;
  public oauth: BoundModule<typeof OAuth>;
  public chat: BoundModule<typeof Chat>;
  public push: BoundModule<typeof Push>;
  public workspaces: BoundModule<typeof Workspaces>;

  private constructor(http: SublayHttpClient) {
    this.http = http;
    this.auth = bindModule(Auth, this.http);
    this.users = bindModule(Users, this.http);
    this.entities = bindModule(Entities, this.http);
    this.events = bindModule(Events, this.http);
    this.comments = bindModule(Comments, this.http);
    this.spaces = bindModule(Spaces, this.http);
    this.collections = bindModule(Collections, this.http);
    this.follows = bindModule(Follows, this.http);
    this.connections = bindModule(Connections, this.http);
    this.appNotifications = bindModule(AppNotifications, this.http);
    this.reports = bindModule(Reports, this.http);
    this.reputation = bindModule(Reputation, this.http);
    this.search = bindModule(Search, this.http);
    this.storage = bindModule(Storage, this.http);
    this.oauth = bindModule(OAuth, this.http);
    this.chat = bindModule(Chat, this.http);
    this.push = bindModule(Push, this.http);
    this.workspaces = bindModule(Workspaces, this.http);
  }

  static async init(config: ClientConfig): Promise<SublayClient> {
    const http = new SublayHttpClient(config);
    return new SublayClient(http);
  }

  /**
   * Callable row-operations accessor for a custom table:
   * `client.table<EventRow>("Events").find(...)`. Row ops only — the js-sdk
   * holds no service key, so there is no table-management/DDL surface.
   */
  table<T = TableRow>(name: string): TableAccessor<T> {
    return createTableAccessor<T>(this.http, name);
  }

  /** Imperatively set the session tokens (SDK-managed mode). */
  setTokens(tokens: AuthTokens): void {
    this.http.setTokens(tokens);
  }

  /** Imperatively clear the session tokens, e.g. on logout (SDK-managed mode). */
  clearTokens(): void {
    this.http.clearTokens();
  }
}

function bindModule<
  T extends Record<string, (client: SublayHttpClient, ...args: any[]) => any>
>(module: T, client: SublayHttpClient): BoundModule<T> {
  const bound: any = {};
  for (const key in module) {
    bound[key] = (...args: any[]) => module[key](client, ...args);
  }
  return bound;
}

export type { ClientConfig, AuthTokens } from "./core/client";
export type {
  FetchOrCreateEntityByForeignIdProps,
  FetchOrCreateEntityByForeignIdResult,
} from "./modules/entities/fetchOrCreateEntityByForeignId";
export type {
  CreateDirectConversationProps,
  CreateDirectConversationResult,
} from "./modules/chat/createDirectConversation";
export type {
  PaginatedResponse,
  PaginationMetadata,
  CursorPaginatedResponse,
  CursorPagination,
} from "./interfaces/IPaginatedResponse";
export type {
  Comment,
  CommentEntity,
  GifData,
  CommentInclude,
  CommentIncludeArray,
  CommentIncludeParam,
  CommentThreadInclude,
  CommentThreadIncludeArray,
  CommentThreadIncludeParam,
  CommentsSortBy,
  CommentReplySortBy,
} from "./interfaces/Comment";
export type {
  Entity,
  EntityRecord,
  EntitySaved,
  SpaceWithViewer,
  EntityInclude,
  EntityIncludeArray,
  EntityIncludeParam,
  CollectionEntityInclude,
  CollectionEntityIncludeArray,
  CollectionEntityIncludeParam,
  DraftInclude,
  DraftIncludeArray,
  DraftIncludeParam,
  EntityUpdateInclude,
  EntityUpdateIncludeArray,
  EntityUpdateIncludeParam,
  TopCommentsParams,
} from "./interfaces/Entity";
export type {
  SpaceReputationContextParams,
  SpaceReputationUserParams,
} from "./interfaces/SpaceReputation";
export type { Collection, DeleteCollectionResponse } from "./interfaces/Collection";
export type { UserSearchParams } from "./interfaces/UserSearch";
export type { SpaceSearchParams, SpaceSearchFields } from "./interfaces/SpaceSearch";
export type {
  ReputationGrant,
  ReputationGrantSourceType,
  ReputationGrantTargetType,
  ReputationGrantTargetFilter,
  GrantSummary,
  ReputationGrantInclude,
  ReputationGrantIncludeArray,
  ReputationGrantIncludeParam,
} from "./interfaces/ReputationGrant";
export type { CreateGrantProps } from "./modules/reputation/createGrant";
export type {
  ListGrantsProps,
  ListGrantsFilter,
  ListGrantsResponse,
} from "./modules/reputation/listGrants";
export type {
  Workspace,
  WorkspaceMember,
  WorkspaceOwnerProfile,
  WorkspaceInvitation,
  MyWorkspaceInvitation,
  WorkspaceInvitationInviter,
  WorkspaceCapability,
  WorkspaceInvitationStatus,
  WorkspaceAuthorityReason,
  WorkspaceAuthorityReasonDetail,
  WorkspaceRosterReason,
  WorkspaceRosterEntry,
  WorkspaceRosterResponse,
  WorkspaceRosterCountsResponse,
  WorkspaceStandingUser,
  WorkspaceMemberStanding,
  WorkspaceAuthority,
  RemoveWorkspaceMemberFromSubtreeResponse,
  SkippedWorkspace,
  WorkspaceInclude,
  WorkspaceIncludeArray,
  WorkspaceIncludeParam,
  WorkspaceMemberInclude,
  WorkspaceMemberIncludeArray,
  WorkspaceMemberIncludeParam,
  WorkspaceListRelation,
  WorkspaceListSortDir,
} from "./interfaces/Workspace";
export type { UpdateMyWorkspaceMembershipProps } from "./modules/workspaces/updateMyWorkspaceMembership";
export type {
  User,
  UserFull,
  AuthUser,
  UserRole,
  UserSuspension,
  UserSummary,
  UserInclude,
  UserIncludeArray,
  UserIncludeParam,
} from "./interfaces/User";
export type {
  Space,
  SpaceDetailed,
  SpaceWithPermissions,
  SpacePreview,
  ChildSpacePreview,
  SpaceInclude,
  SpaceIncludeArray,
  SpaceIncludeParam,
} from "./interfaces/Space";
export type { SpaceMember } from "./interfaces/SpaceMember";
export type {
  Event,
  EventInclude,
  EventIncludeArray,
  EventIncludeParam,
  EventUpdateInclude,
  EventUpdateIncludeArray,
  EventUpdateIncludeParam,
} from "./interfaces/Event";
export type {
  ChatMessage,
  QuotedChatMessage,
  SentChatMessage,
  ChatMessageListInclude,
  ChatMessageListIncludeArray,
  ChatMessageListIncludeParam,
  ChatMessageInclude,
  ChatMessageIncludeArray,
  ChatMessageIncludeParam,
} from "./interfaces/ChatMessage";
export type {
  Conversation,
  ConversationPreview,
  ConversationPreviewLastMessage,
  ConversationType,
} from "./interfaces/Conversation";
export type {
  ConversationMember,
  ConversationMemberRole,
  CheckMyConversationMembershipResponse,
} from "./interfaces/ConversationMember";
export type { SendMessageResponse } from "./modules/chat/sendMessage";
export type { MessageReaction, ListReactionsResponse } from "./modules/chat/listReactions";
export type { Reaction, ReactionType, ReactionCounts } from "./interfaces/Reaction";
export type {
  Report,
  CreateReportResponse,
  UserReport,
  ReportTargetType,
  ReportReason,
  ReportStatus,
  ReportEntityTarget,
  ReportCommentTarget,
  ReportMessageTarget,
  ReportSpace,
} from "./interfaces/Report";
export type { File, FileImage, FileImageVariant } from "./interfaces/File";
export type { ContentSearchResult, ContentSearchChatMessage } from "./modules/search/searchContent";
export type { UserSearchResult } from "./modules/search/searchUsers";
export type { SpaceSearchResult } from "./modules/search/searchSpaces";
export type { AskContentEvent } from "./modules/search/askContent";
export type {
  MatchUsersProps,
  MatchUsersCommonProps,
  MatchUsersResponse,
  UserMatchResult,
  MatchedFacet,
  MatchFacetRef,
  SampleContent,
} from "./modules/search/matchUsers";
export type {
  RequestNewAccessTokenProps,
  RequestNewAccessTokenResponse,
} from "./modules/auth/requestNewAccessToken";
export type { SpaceReportAction } from "./modules/spaces/handleSpaceReport";
export { PUSH_EVENT_TYPES, MUTE_DURATIONS } from "./interfaces/Push";
export type {
  PushEventType,
  MuteDuration,
  NotificationPreferences,
  PushDeviceIdentifier,
  WebPushSubscription,
} from "./interfaces/Push";
export type {
  SignOutResult,
  PushUnbindSkipReason,
} from "./modules/auth/signOut";
export type {
  EmailVerificationOptions,
  EmailVerificationRequiredResponse,
  EmailNotVerifiedErrorBody,
} from "./interfaces/EmailVerification";
export type { SignUpProps, SignUpResponse } from "./modules/auth/signUp";
export type { SignInProps, SignInResponse } from "./modules/auth/signIn";
export type { VerifyEmailProps } from "./modules/auth/verifyEmail";
export type { UpdateNotificationPreferencesProps } from "./modules/push/updateNotificationPreferences";
export type {
  MuteConversationProps,
  MuteConversationResponse,
} from "./modules/chat/muteConversation";
export type {
  TableAccessor,
  TableRow,
  TableQuery,
  DbFilter,
  DbFilterOperator,
  BulkDeleteProps,
  BulkDeleteResult,
  BulkCreateResult,
} from "./interfaces/Table";
export type { FollowRow, FollowStatus } from "./interfaces/Follow";
export type { BlockRow, BlockStatus } from "./interfaces/Block";
export type {
  AcceptedConnectionRow,
  ConnectionRow,
  ConnectionRowStatus,
  ConnectionStatus,
} from "./interfaces/Connection";
export type {
  UnifiedAppNotification,
  PotentiallyPopulatedUnifiedAppNotification,
} from "./interfaces/AppNotification";
export type {
  ImageOptions,
  ImageFit,
  ImageFormat,
  ExactDimensionsOptions,
  AspectRatioWidthOptions,
  AspectRatioHeightOptions,
  OriginalAspectOptions,
  MultiAspectRatioOptions,
} from "./interfaces/ImageProcessing";
export type { Mention, UserMention, SpaceMention } from "./interfaces/Mention";
export type { Rule, FetchManyRulesResponse } from "./interfaces/Rule";
export type {
  SpaceMemberWithUser,
  SpaceMembersResponse,
  SpaceTeamResponse,
} from "./interfaces/SpaceMember";
export type {
  ReadingPermission,
  PostingPermission,
  SpaceVisibility,
  SpaceMemberRole,
  SpaceMemberStatus,
  SpaceMemberPermissions,
  SpaceBreadcrumb,
  SpaceBreadcrumbEntry,
  VisibleSpaceBreadcrumbEntry,
  HiddenSpaceBreadcrumbEntry,
  MySpaceItem,
  MySpacesResponse,
  CheckMyMembershipResponse,
} from "./interfaces/Space";
export type {
  EventType,
  EventVisibility,
  EventStatus,
  RsvpStatus,
  RsvpCounts,
  EventRsvp,
  EventInvite,
} from "./interfaces/Event";
export type { ListMessagesResponse, MessageFilters } from "./modules/chat/listMessages";
export type { ListConversationsResponse } from "./modules/chat/listConversations";
export type {
  VerifyExternalUserProps,
  VerifyExternalUserResponse,
} from "./modules/auth/verifyExternalUser";
export type {
  SendVerificationEmailProps,
  SendCodeVerificationEmailHexProps,
  SendCodeVerificationEmailShortProps,
  SendLinkVerificationEmailProps,
} from "./modules/auth/sendVerificationEmail";

// Every type a public function takes or returns.
export type {
  UserImageUpload,
  UpdateUserProps,
} from "./modules/users/updateUser";
export type {
  SignOutProps,
} from "./modules/auth/signOut";
export type {
  RequestPasswordResetProps,
} from "./modules/auth/requestPasswordReset";
export type {
  ResetPasswordProps,
} from "./modules/auth/resetPassword";
export type {
  ChangePasswordProps,
} from "./modules/auth/changePassword";
export type {
  SetPasswordProps,
} from "./modules/auth/setPassword";
export type {
  ConfirmAccountDeletionProps,
} from "./modules/auth/confirmAccountDeletion";
export type {
  FetchUserByIdProps,
} from "./modules/users/fetchUserById";
export type {
  FetchUserByForeignIdProps,
} from "./modules/users/fetchUserByForeignId";
export type {
  FetchUserByUsernameProps,
} from "./modules/users/fetchUserByUsername";
export type {
  FetchUserSuggestionsProps,
  FetchUserSuggestionsResponse,
} from "./modules/users/fetchUserSuggestions";
export type {
  CheckUsernameAvailabilityProps,
  CheckUsernameAvailabilityResponse,
} from "./modules/users/checkUsernameAvailability";
export type {
  FetchFollowersByUserIdProps,
} from "./modules/users/fetchFollowersByUserId";
export type {
  FetchFollowersCountByUserIdProps,
  FollowersCountResponse,
} from "./modules/users/fetchFollowersCountByUserId";
export type {
  FetchFollowingByUserIdProps,
} from "./modules/users/fetchFollowingByUserId";
export type {
  FetchFollowingCountByUserIdProps,
  FollowingCountResponse,
} from "./modules/users/fetchFollowingCountByUserId";
export type {
  FetchConnectionsByUserIdProps,
} from "./modules/users/fetchConnectionsByUserId";
export type {
  FetchConnectionsCountByUserIdProps,
} from "./modules/users/fetchConnectionsCountByUserId";
export type {
  ConnectionCountResponse,
} from "./interfaces/Connection";
export type {
  FetchCommentsByUserIdProps,
  FetchCommentsByUserIdBaseProps,
} from "./modules/users/fetchCommentsByUserId";
export type {
  CreateFollowProps,
} from "./modules/users/createFollow";
export type {
  DeleteFollowProps,
} from "./modules/users/deleteFollow";
export type {
  FetchFollowStatusProps,
} from "./modules/users/fetchFollowStatus";
export type {
  RequestConnectionProps,
} from "./modules/users/requestConnection";
export type {
  FetchConnectionStatusProps,
} from "./modules/users/fetchConnectionStatus";
export type {
  RemoveConnectionByUserIdProps,
} from "./modules/users/removeConnectionByUserId";
export type {
  CreateBlockProps,
} from "./modules/users/createBlock";
export type {
  DeleteBlockProps,
} from "./modules/users/deleteBlock";
export type {
  FetchBlockStatusProps,
} from "./modules/users/fetchBlockStatus";
export type {
  FetchBlockedUsersProps,
} from "./modules/users/fetchBlockedUsers";
export type {
  CreateEntityProps,
} from "./modules/entities/createEntity";
export type {
  FetchEntityProps,
} from "./modules/entities/fetchEntity";
export type {
  FetchEntityByForeignIdProps,
} from "./modules/entities/fetchEntityByForeignId";
export type {
  FetchEntityByShortIdProps,
} from "./modules/entities/fetchEntityByShortId";
export type {
  FetchManyEntitiesProps,
  FetchManyEntitiesBaseProps,
  KeywordsFilters,
  MetadataFilters,
  TextFilters,
  AttachmentsFilters,
  LocationFilters,
} from "./modules/entities/fetchManyEntities";
export type {
  UpdateEntityProps,
} from "./modules/entities/updateEntity";
export type {
  DeleteEntityProps,
} from "./modules/entities/deleteEntity";
export type {
  FetchDraftsProps,
} from "./modules/entities/fetchDrafts";
export type {
  PublishDraftProps,
} from "./modules/entities/publishDraft";
export type {
  AddEntityReactionProps,
} from "./modules/entities/addReaction";
export type {
  RemoveEntityReactionProps,
} from "./modules/entities/removeReaction";
export type {
  FetchEntityReactionsProps,
  FetchEntityReactionsResponse,
} from "./modules/entities/fetchReactions";
export type {
  GetUserEntityReactionProps,
  UserReactionResponse,
} from "./modules/entities/getUserReaction";
export type {
  CreateEventProps,
  EventCoverUpload,
} from "./modules/events/createEvent";
export type {
  ImageListUpload,
  FileListUpload,
} from "./core/multipart";
export type {
  FetchEventProps,
} from "./modules/events/fetchEvent";
export type {
  FetchManyEventsProps,
  EventLocationFilters,
  EventTextFilters,
  EventDescriptionFilters,
} from "./modules/events/fetchManyEvents";
export type {
  UpdateEventProps,
} from "./modules/events/updateEvent";
export type {
  CancelEventProps,
} from "./modules/events/cancelEvent";
export type {
  CancelEventResponse,
  WithdrawRsvpResponse,
  RemoveHostResponse,
} from "./interfaces/Event";
export type {
  DeleteEventProps,
} from "./modules/events/deleteEvent";
export type {
  SetRsvpProps,
} from "./modules/events/setRsvp";
export type {
  WithdrawRsvpProps,
} from "./modules/events/withdrawRsvp";
export type {
  AddHostProps,
} from "./modules/events/addHost";
export type {
  RemoveHostProps,
} from "./modules/events/removeHost";
export type {
  AddInviteProps,
} from "./modules/events/addInvite";
export type {
  RemoveInviteProps,
} from "./modules/events/removeInvite";
export type {
  FetchInviteesProps,
} from "./modules/events/fetchInvitees";
export type {
  FetchEventRsvpsProps,
} from "./modules/events/fetchEventRsvps";
export type {
  CreateCommentProps,
} from "./modules/comments/createComment";
export type {
  FetchCommentProps,
} from "./modules/comments/fetchComment";
export type {
  FetchCommentByForeignIdProps,
} from "./modules/comments/fetchCommentByForeignId";
export type {
  UpdateCommentProps,
} from "./modules/comments/updateComment";
export type {
  DeleteCommentProps,
} from "./modules/comments/deleteComment";
export type {
  FetchManyCommentsProps,
} from "./modules/comments/fetchManyComments";
export type {
  AddCommentReactionProps,
} from "./modules/comments/addReaction";
export type {
  RemoveCommentReactionProps,
} from "./modules/comments/removeReaction";
export type {
  FetchCommentReactionsProps,
  FetchCommentReactionsResponse,
} from "./modules/comments/fetchReactions";
export type {
  GetUserCommentReactionProps,
  UserCommentReactionResponse,
} from "./modules/comments/getUserReaction";
export type {
  CreateSpaceProps,
  SpaceImageUpload,
} from "./modules/spaces/createSpace";
export type {
  FetchManySpacesProps,
} from "./modules/spaces/fetchManySpaces";
export type {
  FetchSpaceProps,
} from "./modules/spaces/fetchSpace";
export type {
  FetchSpaceByShortIdProps,
} from "./modules/spaces/fetchSpaceByShortId";
export type {
  FetchSpaceBySlugProps,
} from "./modules/spaces/fetchSpaceBySlug";
export type {
  FetchMySpacesProps,
} from "./modules/spaces/fetchMySpaces";
export type {
  FetchMutualSpacesProps,
} from "./modules/spaces/fetchMutualSpaces";
export type {
  CheckSlugAvailabilityProps,
  CheckSlugAvailabilityResponse,
} from "./modules/spaces/checkSlugAvailability";
export type {
  UpdateSpaceProps,
} from "./modules/spaces/updateSpace";
export type {
  DeleteSpaceProps,
} from "./modules/spaces/deleteSpace";
export type {
  FetchSpaceBreadcrumbProps,
} from "./modules/spaces/fetchSpaceBreadcrumb";
export type {
  JoinSpaceProps,
} from "./modules/spaces/joinSpace";
export type {
  LeaveSpaceProps,
} from "./modules/spaces/leaveSpace";
export type {
  CheckMyMembershipProps,
} from "./modules/spaces/checkMyMembership";
export type {
  FetchSpaceMembersProps,
} from "./modules/spaces/fetchSpaceMembers";
export type {
  FetchSpaceTeamProps,
} from "./modules/spaces/fetchSpaceTeam";
export type {
  UpdateMemberRoleProps,
} from "./modules/spaces/updateMemberRole";
export type {
  ApproveMembershipProps,
} from "./modules/spaces/approveMembership";
export type {
  AddMemberProps,
} from "./modules/spaces/addMember";
export type {
  DeclineMembershipProps,
} from "./modules/spaces/declineMembership";
export type {
  BanMemberProps,
} from "./modules/spaces/banMember";
export type {
  UnbanMemberProps,
} from "./modules/spaces/unbanMember";
export type {
  FetchManyRulesProps,
} from "./modules/spaces/fetchManyRules";
export type {
  FetchRuleProps,
} from "./modules/spaces/fetchRule";
export type {
  CreateRuleProps,
} from "./modules/spaces/createRule";
export type {
  UpdateRuleProps,
} from "./modules/spaces/updateRule";
export type {
  DeleteRuleProps,
} from "./modules/spaces/deleteRule";
export type {
  ReorderRulesProps,
} from "./modules/spaces/reorderRules";
export type {
  HandleSpaceReportProps,
} from "./modules/spaces/handleSpaceReport";
export type {
  ModerateSpaceEntityProps,
  ModerationResponse,
} from "./modules/spaces/moderateSpaceEntity";
export type {
  SetSpaceEntityNsfwProps,
  SetSpaceEntityNsfwResponse,
} from "./modules/spaces/setSpaceEntityNsfw";
export type {
  ModerateSpaceCommentProps,
} from "./modules/spaces/moderateSpaceComment";
export type {
  GetSpaceConversationProps,
} from "./modules/spaces/getSpaceConversation";
export type {
  ModerateSpaceChatMessageProps,
  ModerateSpaceChatMessageResponse,
} from "./modules/spaces/moderateSpaceChatMessage";
export type {
  FetchSubCollectionsProps,
  FetchSubCollectionsResponse,
} from "./modules/collections/fetchSubCollections";
export type {
  CreateNewCollectionProps,
} from "./modules/collections/createNewCollection";
export type {
  FetchCollectionEntitiesProps,
  FetchCollectionEntitiesBaseProps,
} from "./modules/collections/fetchCollectionEntities";
export type {
  AddEntityToCollectionProps,
  CollectionEntityMutationResponse,
} from "./modules/collections/addEntityToCollection";
export type {
  RemoveEntityFromCollectionProps,
} from "./modules/collections/removeEntityFromCollection";
export type {
  UpdateCollectionProps,
} from "./modules/collections/updateCollection";
export type {
  DeleteCollectionProps,
} from "./modules/collections/deleteCollection";
export type {
  FetchFollowingProps,
} from "./modules/follows/fetchFollowing";
export type {
  FetchFollowersProps,
} from "./modules/follows/fetchFollowers";
export type {
  DeleteFollowByIdProps,
} from "./modules/follows/deleteFollow";
export type {
  FetchConnectionsProps,
} from "./modules/connections/fetchConnections";
export type {
  FetchSentPendingConnectionsProps,
} from "./modules/connections/fetchSentPendingConnections";
export type {
  FetchReceivedPendingConnectionsProps,
} from "./modules/connections/fetchReceivedPendingConnections";
export type {
  AcceptConnectionProps,
} from "./modules/connections/acceptConnection";
export type {
  DeclineConnectionProps,
} from "./modules/connections/declineConnection";
export type {
  RemoveConnectionProps,
} from "./modules/connections/removeConnection";
export type {
  FetchNotificationsProps,
} from "./modules/app-notifications/fetchNotifications";
export type {
  SystemNotification,
  EntityCommentNotification,
  CommentReplyNotification,
  EntityMentionNotification,
  CommentMentionNotification,
  EntityUpvoteNotification,
  CommentUpvoteNotification,
  EntityReactionNotification,
  CommentReactionNotification,
  EntityReactionMilestoneSpecificNotification,
  EntityReactionMilestoneTotalNotification,
  CommentReactionMilestoneSpecificNotification,
  CommentReactionMilestoneTotalNotification,
  NewFollowNotification,
  ConnectionRequestNotification,
  ConnectionAcceptedNotification,
  SpaceMembershipApprovedNotification,
  SpaceMemberAddedNotification,
  EventInviteNotification,
  EventUpdatedNotification,
  EventCancelledNotification,
  ReputationGrantNotification,
} from "./interfaces/AppNotification";
export type {
  CountUnreadNotificationsResponse,
} from "./modules/app-notifications/countUnreadNotifications";
export type {
  MarkNotificationAsReadProps,
} from "./modules/app-notifications/markNotificationAsRead";
export type {
  CreateReportProps,
} from "./modules/reports/createReport";
export type {
  FetchModeratedReportsProps,
} from "./modules/reports/fetchModeratedReports";
export type {
  SearchContentProps,
} from "./modules/search/searchContent";
export type {
  SearchUsersProps,
} from "./modules/search/searchUsers";
export type {
  SearchSpacesProps,
} from "./modules/search/searchSpaces";
export type {
  AskContentProps,
} from "./modules/search/askContent";
export type {
  UploadImageProps,
} from "./modules/storage/uploadImage";
export type {
  UploadFileProps,
} from "./modules/storage/uploadFile";
export type {
  GetFileProps,
} from "./modules/storage/getFile";
export type {
  DeleteFileProps,
} from "./modules/storage/deleteFile";
export type {
  AuthorizeProps,
  OAuthProvider,
  AuthorizeResponse,
} from "./modules/oauth/authorize";
export type {
  LinkIdentityProps,
} from "./modules/oauth/linkIdentity";
export type {
  ListIdentitiesResponse,
  OAuthIdentity,
} from "./interfaces/OAuthIdentity";
export type {
  UnlinkIdentityProps,
} from "./modules/oauth/unlinkIdentity";
export type {
  ListConversationsProps,
} from "./modules/chat/listConversations";
export type {
  CreateGroupConversationProps,
} from "./modules/chat/createGroupConversation";
export type {
  GetConversationProps,
} from "./modules/chat/getConversation";
export type {
  UpdateConversationProps,
} from "./modules/chat/updateConversation";
export type {
  DeleteConversationProps,
} from "./modules/chat/deleteConversation";
export type {
  UnreadCountResponse,
} from "./modules/chat/getUnreadCount";
export type {
  ListMembersProps,
} from "./modules/chat/listMembers";
export type {
  RemoveMemberProps,
} from "./modules/chat/removeMember";
export type {
  LeaveConversationProps,
} from "./modules/chat/leaveConversation";
export type {
  CheckMyConversationMembershipProps,
} from "./modules/chat/checkMyConversationMembership";
export type {
  ChangeMemberRoleProps,
} from "./modules/chat/changeMemberRole";
export type {
  ListMessagesProps,
} from "./modules/chat/listMessages";
export type {
  SendMessageProps,
} from "./modules/chat/sendMessage";
export type {
  GetMessageProps,
} from "./modules/chat/getMessage";
export type {
  EditMessageProps,
} from "./modules/chat/editMessage";
export type {
  DeleteMessageProps,
} from "./modules/chat/deleteMessage";
export type {
  ToggleReactionProps,
  ToggleReactionResponse,
} from "./modules/chat/toggleReaction";
export type {
  ListReactionsProps,
} from "./modules/chat/listReactions";
export type {
  MarkAsReadProps,
} from "./modules/chat/markAsRead";
export type {
  CreateWorkspaceProps,
} from "./modules/workspaces/createWorkspace";
export type {
  FetchWorkspaceProps,
} from "./modules/workspaces/fetchWorkspace";
export type {
  FetchManyWorkspacesProps,
} from "./modules/workspaces/fetchManyWorkspaces";
export type {
  FetchMutualWorkspacesProps,
} from "./modules/workspaces/fetchMutualWorkspaces";
export type {
  UpdateWorkspaceProps,
} from "./modules/workspaces/updateWorkspace";
export type {
  UpdateWorkspaceInheritFlagProps,
} from "./modules/workspaces/updateWorkspaceInheritFlag";
export type {
  DeleteWorkspaceProps,
} from "./modules/workspaces/deleteWorkspace";
export type {
  TransferWorkspaceOwnershipProps,
} from "./modules/workspaces/transferWorkspaceOwnership";
export type {
  FetchWorkspaceMembersProps,
} from "./modules/workspaces/fetchWorkspaceMembers";
export type {
  FetchWorkspaceMemberStandingProps,
} from "./modules/workspaces/fetchWorkspaceMemberStanding";
export type {
  FetchMyWorkspaceMembershipProps,
} from "./modules/workspaces/fetchMyWorkspaceMembership";
export type {
  UpdateWorkspaceMemberProps,
} from "./modules/workspaces/updateWorkspaceMember";
export type {
  RemoveWorkspaceMemberProps,
} from "./modules/workspaces/removeWorkspaceMember";
export type {
  LeaveWorkspaceProps,
} from "./modules/workspaces/leaveWorkspace";
export type {
  RemoveWorkspaceMemberFromSubtreeProps,
} from "./modules/workspaces/removeWorkspaceMemberFromSubtree";
export type {
  CreateWorkspaceInviteProps,
} from "./modules/workspaces/createWorkspaceInvite";
export type {
  FetchWorkspaceInvitesProps,
  FetchWorkspaceInvitesResponse,
} from "./modules/workspaces/fetchWorkspaceInvites";
export type {
  RevokeWorkspaceInviteProps,
} from "./modules/workspaces/revokeWorkspaceInvite";
export type {
  ResendWorkspaceInviteProps,
} from "./modules/workspaces/resendWorkspaceInvite";
export type {
  AcceptWorkspaceInviteProps,
} from "./modules/workspaces/acceptWorkspaceInvite";
export type {
  DeclineWorkspaceInviteProps,
} from "./modules/workspaces/declineWorkspaceInvite";
export type {
  FetchMyWorkspaceInvitesResponse,
} from "./modules/workspaces/fetchMyWorkspaceInvites";
export type {
  FetchWorkspaceAuthorityProps,
} from "./modules/workspaces/fetchWorkspaceAuthority";
// Two modules name their props `AddMemberProps`: the spaces one is exported
// above under that name, the chat one under this.
export type { AddMemberProps as AddConversationMemberProps } from "./modules/chat/addMember";
