import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "댓글 추가...",
  cancel: "취소",
  post: "게시",
  replyingTo: (name: string) => `${name}님에게 답글 작성 중`,

  // Comment list
  noCommentsTitle: "아직 댓글이 없습니다",
  noCommentsSubtitle: "대화를 시작해 보세요.",
  loadMoreComments: "댓글 더 불러오기",
  loading: "불러오는 중...",
  loadCommentsFailed: "댓글을 불러오지 못했습니다",
  loadMoreFailed: "더 불러오지 못했습니다",
  tryAgain: "다시 시도",
  sortTop: "인기순",
  sortNew: "최신순",
  sortOld: "오래된순",

  // A comment
  reply: "답글",
  viewMoreReplies: (count: number) => `답글 더 보기 (${count})`,
  hideReplies: "답글 숨기기",
  removeYourReaction: "내 반응 취소",
  timeAgo: {
    justNow: "방금 전",
    minutes: (count: number) => `${count}분 전`,
    hours: (count: number) => `${count}시간 전`,
    days: (count: number) => `${count}일 전`,
    months: (count: number) => `${count}개월 전`,
    years: (count: number) => `${count}년 전`,
  },

  // Comments that can't be shown
  deleted: "[삭제됨]",
  removed: "[숨김 처리됨]",
  unavailable: "이 댓글을 볼 수 없습니다",
  blockedAuthor: "차단한 사용자의 댓글",
  showAnyway: "그래도 보기",
  removedByModerator: (reason?: string | null) =>
    `관리자가 숨김 처리함${reason ? `: ${reason}` : ""} · 나에게만 보입니다`,

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
  commentEmpty: "댓글 내용을 입력하세요",
  userNotMentionable: "이 사용자는 사용자 이름이 없어 언급할 수 없습니다",
  parentDeleted: "삭제된 댓글에는 답글을 달 수 없습니다.",
  parentRemoved: "숨김 처리된 댓글에는 답글을 달 수 없습니다.",
  postFailed: "댓글을 게시하지 못했습니다. 다시 시도하세요.",
};

export default strings;
