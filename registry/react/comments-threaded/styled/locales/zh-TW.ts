import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "加入討論",
  replyPlaceholder: "新增你的回覆...",
  cancel: "取消",
  submitComment: "發佈",
  addGif: "新增 GIF",

  // Sorting
  sortBy: "排序方式",
  sortTop: "熱門",
  sortNew: "最新",
  sortOld: "最舊",
  sortControversial: "有爭議",

  // Comment list
  noCommentsTitle: "還沒有留言",
  noCommentsSubtitle: "來開啟話題吧。",
  viewAllComments: "查看所有留言",
  loadMoreComments: "載入更多留言",
  loading: "載入中...",
  loadCommentsFailed: "無法載入留言",
  loadMoreFailed: "無法載入更多",
  tryAgain: "重試",

  // A comment
  reply: "回覆",
  replyCount: (count: number) => `${count} 則回覆`,
  moreReplyCount: (count: number) => `還有 ${count} 則回覆`,
  moreReplies: "更多回覆",
  expandThread: "展開討論串",
  collapseThread: "收合討論串",
  moreOptions: "更多選項",
  upvote: "讚",
  downvote: "倒讚",
  removeYourVote: "收回你的投票",

  // Comments that can't be shown
  deleted: "[已刪除]",
  removed: "[已移除]",
  unavailable: "這則留言無法顯示",
  blockedAuthor: "來自你已封鎖使用者的留言",
  showAnyway: "仍要顯示",
  removedByModerator: (reason?: string | null) =>
    `已被管理員移除${reason ? `：${reason}` : ""} · 只有你看得到`,

  // Mentions
  noUsersFound: "找不到使用者",

  // Menus
  report: "檢舉",
  remove: "刪除",
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
  loginRequired: "請先登入才能執行此操作",
  usernameRequired: "請先設定使用者名稱，才能參與留言互動",
  commentEmpty: "留言不能空白",
  userNotMentionable: "無法標註此使用者（尚未設定使用者名稱）",
  parentDeleted: "這則留言已被刪除，無法回覆。",
  parentRemoved: "這則留言已被移除，無法回覆。",
  postFailed: "無法發佈你的留言，請再試一次。",
};

export default strings;
