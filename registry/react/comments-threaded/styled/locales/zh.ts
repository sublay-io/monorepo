import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "参与讨论",
  replyPlaceholder: "写下你的回复...",
  cancel: "取消",
  submitComment: "发布",
  addGif: "添加 GIF",

  // Sorting
  sortBy: "排序方式",
  sortTop: "热门",
  sortNew: "最新",
  sortOld: "最早",
  sortControversial: "有争议",

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
  continueThread: "继续查看此讨论",
  expandThread: "展开讨论",
  collapseThread: "收起讨论",
  moreOptions: "更多选项",
  upvote: "赞同",
  downvote: "反对",
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
  remove: "删除",
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
  loginRequired: "请先登录再执行此操作",
  usernameRequired: "请先设置用户名再参与评论",
  commentEmpty: "评论不能为空",
  userNotMentionable: "该用户没有用户名，无法提及",
  parentDeleted: "此评论已被删除，无法回复。",
  parentRemoved: "此评论已被移除，无法回复。",
  postFailed: "无法发布你的评论，请重试。",
};

export default strings;
