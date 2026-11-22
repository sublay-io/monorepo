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
export type { UploadFileResponse } from "./modules/storage/uploadFile";
export type { UploadImageResponse, UploadedImageVariant } from "./modules/storage/uploadImage";
export type { GetFileResponse, GetFileImage } from "./modules/storage/getFile";
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
