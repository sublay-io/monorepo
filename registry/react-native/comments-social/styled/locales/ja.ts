import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "コメントを追加...",
  cancel: "キャンセル",
  post: "投稿",
  replyingTo: (name: string) => `返信先: ${name}`,

  // Comment list
  noCommentsTitle: "まだコメントはありません",
  noCommentsSubtitle: "最初のコメントを投稿しましょう。",
  loadCommentsFailed: "コメントを読み込めませんでした",
  loadMoreFailed: "続きを読み込めませんでした",
  tryAgain: "再試行",
  sortTop: "人気順",
  sortNew: "新しい順",
  sortOld: "古い順",

  // A comment
  reply: "返信",
  viewMoreReplies: (count: number) => `他の返信を表示 (${count})`,
  hideReplies: "返信を非表示",
  removeYourReaction: "リアクションを取り消す",
  timeAgo: {
    justNow: "たった今",
    minutes: (count: number) => `${count}分前`,
    hours: (count: number) => `${count}時間前`,
    days: (count: number) => `${count}日前`,
    months: (count: number) => `${count}か月前`,
    years: (count: number) => `${count}年前`,
  },

  // Comments that can't be shown
  deleted: "[削除済み]",
  removed: "[非表示]",
  unavailable: "このコメントは表示できません",
  blockedAuthor: "ブロックしたユーザーのコメント",
  showAnyway: "表示する",
  removedByModerator: (reason?: string | null) =>
    `モデレーターにより非表示${reason ? `: ${reason}` : ""} · あなたにのみ表示されています`,

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
