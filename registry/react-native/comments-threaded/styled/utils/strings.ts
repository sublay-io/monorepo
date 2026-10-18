import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Join the conversation",
  cancel: "Cancel",
  replyingTo: "Replying to",
  cancelReply: "Cancel reply",
  moreOptions: "More options",
  // Screen-reader actions on a comment (tapping it collapses it)
  collapseThread: "Collapse thread",
  expandThread: "Expand thread",

  // Sorting
  sortBy: "Sort by",
  sortSheetTitle: "Sort comments by",
  sortTop: "Top",
  sortNew: "New",
  sortOld: "Old",
  sortControversial: "Controversial",

  // When a comment was posted
  timeAgo: {
    justNow: "Just now",
    minutes: (count: number) =>
      count === 1 ? "a minute ago" : `${count} minutes ago`,
    hours: (count: number) =>
      count === 1 ? "an hour ago" : `${count} hours ago`,
    days: (count: number) => (count === 1 ? "a day ago" : `${count} days ago`),
    months: (count: number) =>
      count === 1 ? "a month ago" : `${count} months ago`,
    years: (count: number) =>
      count === 1 ? "a year ago" : `${count} years ago`,
  },

  // Comment list
  noCommentsTitle: "No comments yet",
  noCommentsSubtitle: "Start the conversation.",
  viewAllComments: "View all comments",
  loadMoreComments: "Load more comments",
  loading: "Loading...",
  loadCommentsFailed: "Couldn't load comments",
  loadMoreFailed: "Couldn't load more",
  tryAgain: "Try again",

  // A comment
  reply: "Reply",
  replyCount: (count: number) => `${count} ${count === 1 ? "reply" : "replies"}`,
  moreReplyCount: (count: number) =>
    `${count} more ${count === 1 ? "reply" : "replies"}`,
  moreReplies: "More replies",
  removeYourVote: "Remove your vote",

  // Comments that can't be shown
  deleted: "[deleted]",
  removed: "[removed]",
  unavailable: "This comment is unavailable",
  blockedAuthor: "Comment from a user you blocked",
  showAnyway: "Show anyway",
  removedByModerator: (reason?: string | null) =>
    `Removed by a moderator${reason ? `: ${reason}` : ""} · only you can see this`,

  // Mentions
  noUsersFound: "No users found",

  // Menus
  report: "Report",
  delete: "Delete",
  deleteCommentTitle: "Delete comment",
  confirmDelete: "Are you sure you want to delete this comment?",

  // Report dialog
  reportTitle: "Submit a report",
  reportIntro:
    "Thank you for looking out for our community. Let us know what's happening, and we'll look into it.",
  reportReasons: {
    spam: "It's spam",
    inappropriateContent: "Contains inappropriate content",
    harassment: "It's harassment or bullying",
    misinformation: "Spreads false information",
    hateSpeech: "Contains hate speech or symbols",
    violence: "Promotes violence or dangerous behavior",
    illegalActivity: "Promotes illegal activity",
    selfHarm: "Promotes self-harm or suicide",
    other: "Other",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Submit report",
  submittingReport: "Submitting...",

  // Messages
  parentDeleted: "This comment was deleted, so you can't reply to it.",
  parentRemoved: "This comment was removed, so you can't reply to it.",
  postFailed: "Couldn't post your comment. Try again.",
};

export default strings;
