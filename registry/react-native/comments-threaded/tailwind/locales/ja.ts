import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "会話に参加する",
  cancel: "キャンセル",
  replyingTo: "返信先:",
  cancelReply: "返信をキャンセル",
  collapseThread: "スレッドを折りたたむ",
  expandThread: "スレッドを展開",

  // Sorting
  sortBy: "並べ替え",
  sortSheetTitle: "コメントの並べ替え",
  sortTop: "人気順",
  sortNew: "新しい順",
  sortOld: "古い順",
  sortControversial: "賛否両論",

  // When a comment was posted
  timeAgo: {
    justNow: "たった今",
    minutes: (count: number) => `${count}分前`,
    hours: (count: number) => `${count}時間前`,
    days: (count: number) => `${count}日前`,
    months: (count: number) => `${count}か月前`,
    years: (count: number) => `${count}年前`,
  },

  // Comment list
  noCommentsTitle: "まだコメントはありません",
  noCommentsSubtitle: "最初のコメントを投稿しましょう。",
  viewAllComments: "すべてのコメントを表示",
  loadMoreComments: "コメントをさらに読み込む",
  loading: "読み込み中...",
  loadCommentsFailed: "コメントを読み込めませんでした",
  loadMoreFailed: "続きを読み込めませんでした",
  tryAgain: "再試行",

  // A comment
  reply: "返信",
  replyCount: (count: number) => `${count}件の返信`,
  moreReplyCount: (count: number) => `他${count}件の返信`,
  moreReplies: "その他の返信",
  removeYourVote: "評価を取り消す",

  // Comments that can't be shown
  deleted: "[削除済み]",
  removed: "[非表示]",
  unavailable: "このコメントは表示できません",
  blockedAuthor: "ブロックしたユーザーのコメント",
  showAnyway: "表示する",
  removedByModerator: (reason?: string | null) =>
    `モデレーターにより非表示${reason ? `: ${reason}` : ""} · あなたにのみ表示されています`,

  // Mentions
  noUsersFound: "ユーザーが見つかりません",

  // Menus
  report: "報告",
  delete: "削除",
  deleteCommentTitle: "コメントを削除",
  confirmDelete: "このコメントを削除しますか？",

  // Report dialog
  reportTitle: "報告を送信",
  reportIntro: "コミュニティへのご協力ありがとうございます。状況をお知らせいただければ確認します。",
  reportReasons: {
    spam: "スパム",
    inappropriateContent: "不適切なコンテンツが含まれている",
    harassment: "嫌がらせやいじめ",
    misinformation: "虚偽の情報を広めている",
    hateSpeech: "ヘイトスピーチやヘイトシンボルが含まれている",
    violence: "暴力や危険な行為を助長している",
    illegalActivity: "違法行為を助長している",
    selfHarm: "自傷行為や自殺を助長している",
    other: "その他",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "報告を送信",
  submittingReport: "送信中...",

  // Messages
  parentDeleted: "このコメントは削除されたため、返信できません。",
  parentRemoved: "このコメントは非表示になったため、返信できません。",
  postFailed: "コメントを投稿できませんでした。もう一度お試しください。",
};

export default strings;
