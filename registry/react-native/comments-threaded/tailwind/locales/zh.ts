import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "参与讨论",
  cancel: "取消",
  replyingTo: "回复",
  cancelReply: "取消回复",
  collapseThread: "收起讨论",
  expandThread: "展开讨论",

  // Sorting
  sortBy: "排序方式",
  sortSheetTitle: "评论排序方式",
  sortTop: "热门",
  sortNew: "最新",
  sortOld: "最早",
  sortControversial: "有争议",

  // When a comment was posted
  timeAgo: {
    justNow: "刚刚",
    minutes: (count: number) => `${count} 分钟前`,
    hours: (count: number) => `${count} 小时前`,
    days: (count: number) => `${count} 天前`,
    months: (count: number) => `${count} 个月前`,
    years: (count: number) => `${count} 年前`,
  },

  // Comment list
  noCommentsTitle: "暂无评论",
  noCommentsSubtitle: "来发表第一条评论吧。",
  viewAllComments: "查看全部评论",
  loadMoreComments: "加载更多评论",
  loading: "加载中...",
  loadCommentsFailed: "无法加载评论",
  loadMoreFailed: "无法加载更多",
  tryAgain: "重试",

  // A comment
  reply: "回复",
  replyCount: (count: number) => `${count} 条回复`,
  moreReplyCount: (count: number) => `还有 ${count} 条回复`,
  moreReplies: "更多回复",
  removeYourVote: "撤销你的投票",

  // Comments that can't be shown
  deleted: "[已删除]",
  removed: "[已移除]",
  unavailable: "此评论不可用",
  blockedAuthor: "来自你已屏蔽用户的评论",
  showAnyway: "仍然显示",
  removedByModerator: (reason?: string | null) =>
    `已被管理员移除${reason ? `：${reason}` : ""} · 仅你可见`,

  // Mentions
  noUsersFound: "未找到用户",

  // Menus
  report: "举报",
  delete: "删除",
  deleteCommentTitle: "删除评论",
  confirmDelete: "确定要删除这条评论吗？",

  // Report dialog
  reportTitle: "提交举报",
  reportIntro: "感谢你维护我们的社区。请告诉我们发生了什么，我们会进行核查。",
  reportReasons: {
    spam: "垃圾信息",
    inappropriateContent: "包含不当内容",
    harassment: "骚扰或欺凌",
    misinformation: "传播虚假信息",
    hateSpeech: "包含仇恨言论或符号",
    violence: "宣扬暴力或危险行为",
    illegalActivity: "宣扬违法活动",
    selfHarm: "宣扬自残或自杀",
    other: "其他",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "提交举报",
  submittingReport: "提交中...",

  // Messages
  parentDeleted: "此评论已被删除，无法回复。",
  parentRemoved: "此评论已被移除，无法回复。",
  postFailed: "无法发布你的评论，请重试。",
};

export default strings;
