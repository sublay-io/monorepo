import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "تبصرہ لکھیں...",
  cancel: "منسوخ کریں",
  post: "پوسٹ کریں",
  replyingTo: (name: string) => `${name} کو جواب`,

  // Comment list
  noCommentsTitle: "ابھی تک کوئی تبصرہ نہیں",
  noCommentsSubtitle: "گفتگو شروع کریں۔",
  loadMoreComments: "مزید تبصرے لوڈ کریں",
  loading: "لوڈ ہو رہا ہے...",
  loadCommentsFailed: "تبصرے لوڈ نہیں ہو سکے",
  loadMoreFailed: "مزید لوڈ نہیں ہو سکا",
  tryAgain: "دوبارہ کوشش کریں",
  sortTop: "نمایاں",
  sortNew: "نئے",
  sortOld: "پرانے",

  // A comment
  reply: "جواب دیں",
  viewMoreReplies: (count: number) => `مزید جوابات دیکھیں (${count})`,
  hideReplies: "جوابات چھپائیں",
  removeYourReaction: "اپنا ردعمل ہٹائیں",
  timeAgo: {
    justNow: "ابھی ابھی",
    minutes: (count: number) =>
      count === 1 ? "ایک منٹ پہلے" : `${count} منٹ پہلے`,
    hours: (count: number) =>
      count === 1 ? "ایک گھنٹہ پہلے" : `${count} گھنٹے پہلے`,
    days: (count: number) => (count === 1 ? "ایک دن پہلے" : `${count} دن پہلے`),
    months: (count: number) =>
      count === 1 ? "ایک مہینہ پہلے" : `${count} مہینے پہلے`,
    years: (count: number) =>
      count === 1 ? "ایک سال پہلے" : `${count} سال پہلے`,
  },

  // Comments that can't be shown
  deleted: "[حذف شدہ]",
  removed: "[ہٹا دیا گیا]",
  unavailable: "یہ تبصرہ دستیاب نہیں ہے",
  blockedAuthor: "اس صارف کا تبصرہ جسے آپ نے بلاک کیا ہے",
  showAnyway: "پھر بھی دکھائیں",
  removedByModerator: (reason?: string | null) =>
    `ایک ماڈریٹر نے ہٹا دیا${reason ? `: ${reason}` : ""} · صرف آپ اسے دیکھ سکتے ہیں`,

  // Menus
  report: "رپورٹ کریں",
  remove: "حذف کریں",
  confirmDelete: "کیا آپ واقعی یہ تبصرہ حذف کرنا چاہتے ہیں؟",

  // Report dialog
  reportTitle: "رپورٹ بھیجیں",
  reportIntro:
    "ہماری کمیونٹی کا خیال رکھنے کا شکریہ۔ ہمیں بتائیں کہ کیا ہو رہا ہے، ہم اس کا جائزہ لیں گے۔",
  reportReasons: {
    spam: "یہ اسپام ہے",
    inappropriateContent: "اس میں نامناسب مواد ہے",
    harassment: "یہ ہراسانی یا دھونس ہے",
    misinformation: "یہ غلط معلومات پھیلاتا ہے",
    hateSpeech: "اس میں نفرت انگیز زبان یا علامات ہیں",
    violence: "یہ تشدد یا خطرناک رویے کو فروغ دیتا ہے",
    illegalActivity: "یہ غیر قانونی سرگرمی کو فروغ دیتا ہے",
    selfHarm: "یہ خود کو نقصان پہنچانے یا خودکشی کو فروغ دیتا ہے",
    other: "دیگر",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "رپورٹ بھیجیں",
  submittingReport: "بھیجا جا رہا ہے...",

  // Messages
  loginRequired: "یہ کام کرنے کے لیے لاگ اِن کریں",
  commentEmpty: "تبصرہ خالی نہیں ہو سکتا",
  userNotMentionable:
    "اس صارف کا کوئی یوزر نیم نہیں ہے، اس لیے اسے مینشن نہیں کیا جا سکتا",
  parentDeleted:
    "یہ تبصرہ حذف کر دیا گیا ہے، اس لیے آپ اس کا جواب نہیں دے سکتے۔",
  parentRemoved:
    "یہ تبصرہ ہٹا دیا گیا ہے، اس لیے آپ اس کا جواب نہیں دے سکتے۔",
  postFailed: "آپ کا تبصرہ پوسٹ نہیں ہو سکا۔ دوبارہ کوشش کریں۔",
};

export default strings;
