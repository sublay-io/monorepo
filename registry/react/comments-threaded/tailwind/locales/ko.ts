import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "대화에 참여하기",
  replyPlaceholder: "답글 입력...",
  cancel: "취소",
  submitComment: "게시",
  addGif: "GIF 추가",

  // Sorting
  sortBy: "정렬",
  sortTop: "인기순",
  sortNew: "최신순",
  sortOld: "오래된순",
  sortControversial: "논쟁적",

  // Comment list
  noCommentsTitle: "아직 댓글이 없습니다",
  noCommentsSubtitle: "대화를 시작해 보세요.",
  viewAllComments: "모든 댓글 보기",
  loadMoreComments: "댓글 더 불러오기",
  loading: "불러오는 중...",
  loadCommentsFailed: "댓글을 불러오지 못했습니다",
  loadMoreFailed: "더 불러오지 못했습니다",
  tryAgain: "다시 시도",

  // A comment
  reply: "답글",
  replyCount: (count: number) => `답글 ${count}개`,
  moreReplyCount: (count: number) => `답글 ${count}개 더 보기`,
  moreReplies: "답글 더 보기",
  expandThread: "스레드 펼치기",
  collapseThread: "스레드 접기",
  moreOptions: "옵션 더 보기",
  upvote: "추천",
  downvote: "비추천",
  removeYourVote: "내 투표 취소",

  // Comments that can't be shown
  deleted: "[삭제됨]",
  removed: "[숨김 처리됨]",
  unavailable: "이 댓글을 볼 수 없습니다",
  blockedAuthor: "차단한 사용자의 댓글",
  showAnyway: "그래도 보기",
  removedByModerator: (reason?: string | null) =>
    `관리자가 숨김 처리함${reason ? `: ${reason}` : ""} · 나에게만 보입니다`,

  // Mentions
  noUsersFound: "사용자를 찾을 수 없습니다",

  // Menus
  report: "신고",
  remove: "삭제",
  confirmDelete: "이 댓글을 삭제하시겠습니까?",

  // Report dialog
  reportTitle: "신고 제출",
  reportIntro: "커뮤니티를 지켜 주셔서 감사합니다. 무슨 일인지 알려 주시면 확인하겠습니다.",
  reportReasons: {
    spam: "스팸입니다",
    inappropriateContent: "부적절한 콘텐츠가 포함되어 있습니다",
    harassment: "괴롭힘 또는 따돌림입니다",
    misinformation: "허위 정보를 퍼뜨립니다",
    hateSpeech: "혐오 발언이나 상징이 포함되어 있습니다",
    violence: "폭력이나 위험한 행동을 조장합니다",
    illegalActivity: "불법 행위를 조장합니다",
    selfHarm: "자해나 자살을 조장합니다",
    other: "기타",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "신고 제출",
  submittingReport: "제출 중...",

  // Messages
  loginRequired: "이 작업을 하려면 로그인하세요",
  usernameRequired: "댓글을 이용하려면 먼저 사용자 이름을 설정하세요",
  commentEmpty: "댓글 내용을 입력하세요",
  userNotMentionable: "이 사용자는 사용자 이름이 없어 언급할 수 없습니다",
  parentDeleted: "삭제된 댓글에는 답글을 달 수 없습니다.",
  parentRemoved: "숨김 처리된 댓글에는 답글을 달 수 없습니다.",
  postFailed: "댓글을 게시하지 못했습니다. 다시 시도하세요.",
};

export default strings;
