import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "新增留言...",
  cancel: "取消",
  post: "發佈",
  replyingTo: (name: string) => `回覆 ${name}`,

  // Comment list
  noCommentsTitle: "還沒有留言",
  noCommentsSubtitle: "來開啟話題吧。",
  loadCommentsFailed: "無法載入留言",
  loadMoreFailed: "無法載入更多",
  tryAgain: "重試",
  sortTop: "熱門",
  sortNew: "最新",
  sortOld: "最舊",

  // A comment
  reply: "回覆",
  viewMoreReplies: (count: number) => `查看另外 ${count} 則回覆`,
  hideReplies: "隱藏回覆",
  removeYourReaction: "收回你的表情回應",
  timeAgo: {
    justNow: "剛剛",
    minutes: (count: number) => `${count} 分鐘前`,
    hours: (count: number) => `${count} 小時前`,
    days: (count: number) => `${count} 天前`,
    months: (count: number) => `${count} 個月前`,
    years: (count: number) => `${count} 年前`,
  },

  // Comments that can't be shown
  deleted: "[已刪除]",
  removed: "[已移除]",
  unavailable: "這則留言無法顯示",
  blockedAuthor: "來自你已封鎖使用者的留言",
  showAnyway: "仍要顯示",
  removedByModerator: (reason?: string | null) =>
    `已被管理員移除${reason ? `：${reason}` : ""} · 只有你看得到`,

  // Menus
  report: "檢舉",
  delete: "刪除",
  deleteCommentTitle: "刪除留言",
  confirmDelete: "確定要刪除這則留言嗎？",

  // Report dialog
  reportTitle: "提出檢舉",
  reportIntro:
    "感謝你協助維護我們的社群。請告訴我們發生了什麼事，我們會進一步了解。",
  reportReasons: {
    spam: "垃圾訊息",
    inappropriateContent: "含有不當內容",
    harassment: "騷擾或霸凌",
    misinformation: "散布不實資訊",
    hateSpeech: "含有仇恨言論或符號",
    violence: "宣揚暴力或危險行為",
    illegalActivity: "宣揚違法活動",
    selfHarm: "宣揚自殘或自殺",
    other: "其他",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "送出檢舉",
  submittingReport: "送出中...",

  // Messages
  parentDeleted: "這則留言已被刪除，無法回覆。",
  parentRemoved: "這則留言已被移除，無法回覆。",
  postFailed: "無法發佈你的留言，請再試一次。",
};

export default strings;
