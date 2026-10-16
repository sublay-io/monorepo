import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Add a comment...",
  cancel: "Cancel",
  post: "Post",
  replyingTo: (name: string) => `Replying to ${name}`,

  // Comment list
  noCommentsTitle: "No comments yet",
  noCommentsSubtitle: "Start the conversation.",
  loadCommentsFailed: "Couldn't load comments",
  loadMoreFailed: "Couldn't load more",
  tryAgain: "Try again",
  sortTop: "Top",
  sortNew: "New",
  sortOld: "Old",

  // A comment
  reply: "Reply",
  viewMoreReplies: (count: number) =>
    `View ${count} more ${count === 1 ? "reply" : "replies"}`,
  hideReplies: "Hide replies",
  removeYourReaction: "Remove your reaction",
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

  // Comments that can't be shown
  deleted: "[deleted]",
  removed: "[removed]",
  unavailable: "This comment is unavailable",
  blockedAuthor: "Comment from a user you blocked",
  showAnyway: "Show anyway",
  removedByModerator: (reason?: string | null) =>
    `Removed by a moderator${reason ? `: ${reason}` : ""} · only you can see this`,

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
