import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "به گفت‌وگو بپیوندید",
  cancel: "لغو",
  replyingTo: "در پاسخ به",
  cancelReply: "لغو پاسخ",

  // Sorting
  sortBy: "مرتب‌سازی بر اساس",
  sortSheetTitle: "مرتب‌سازی نظرها بر اساس",
  sortTop: "برترین",
  sortNew: "جدیدترین",
  sortOld: "قدیمی‌ترین",
  sortControversial: "بحث‌برانگیز",

  // When a comment was posted
  timeAgo: {
    justNow: "همین حالا",
    minutes: (count: number) =>
      count === 1 ? "یک دقیقه پیش" : `${count} دقیقه پیش`,
    hours: (count: number) =>
      count === 1 ? "یک ساعت پیش" : `${count} ساعت پیش`,
    days: (count: number) => (count === 1 ? "یک روز پیش" : `${count} روز پیش`),
    months: (count: number) =>
      count === 1 ? "یک ماه پیش" : `${count} ماه پیش`,
    years: (count: number) =>
      count === 1 ? "یک سال پیش" : `${count} سال پیش`,
  },

  // Comment list
  noCommentsTitle: "هنوز نظری ثبت نشده",
  noCommentsSubtitle: "گفت‌وگو را شروع کنید.",
  viewAllComments: "مشاهدهٔ همهٔ نظرها",
  loadMoreComments: "بارگذاری نظرهای بیشتر",
  loading: "در حال بارگذاری...",
  loadCommentsFailed: "بارگذاری نظرها ممکن نشد",
  loadMoreFailed: "بارگذاری موارد بیشتر ممکن نشد",
  tryAgain: "تلاش دوباره",

  // A comment
  reply: "پاسخ",
  replyCount: (count: number) => `${count} پاسخ`,
  moreReplyCount: (count: number) => `${count} پاسخ دیگر`,
  moreReplies: "پاسخ‌های بیشتر",
  removeYourVote: "حذف رأی شما",

  // Comments that can't be shown
  deleted: "[حذف‌شده]",
  removed: "[برداشته‌شده]",
  unavailable: "این نظر در دسترس نیست",
  blockedAuthor: "نظر کاربری که مسدودش کرده‌اید",
  showAnyway: "در هر حال نمایش بده",
  removedByModerator: (reason?: string | null) =>
    `یکی از مدیران آن را برداشت${reason ? `: ${reason}` : ""} · فقط شما این را می‌بینید`,

  // Mentions
  noUsersFound: "کاربری پیدا نشد",

  // Menus
  report: "گزارش",
  delete: "حذف",
  deleteCommentTitle: "حذف نظر",
  confirmDelete: "آیا از حذف این نظر مطمئن هستید؟",

  // Report dialog
  reportTitle: "ارسال گزارش",
  reportIntro:
    "از اینکه مراقب جامعهٔ ما هستید سپاسگزاریم. به ما بگویید چه اتفاقی افتاده تا آن را بررسی کنیم.",
  reportReasons: {
    spam: "هرزنامه است",
    inappropriateContent: "محتوای نامناسب دارد",
    harassment: "آزار یا قلدری است",
    misinformation: "اطلاعات نادرست پخش می‌کند",
    hateSpeech: "حاوی سخنان یا نمادهای نفرت‌پراکن است",
    violence: "خشونت یا رفتار خطرناک را ترویج می‌کند",
    illegalActivity: "فعالیت غیرقانونی را ترویج می‌کند",
    selfHarm: "آسیب به خود یا خودکشی را ترویج می‌کند",
    other: "سایر",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "ارسال گزارش",
  submittingReport: "در حال ارسال...",

  // Messages
  parentDeleted:
    "این نظر حذف شده است، بنابراین نمی‌توانید به آن پاسخ دهید.",
  parentRemoved:
    "این نظر برداشته شده است، بنابراین نمی‌توانید به آن پاسخ دهید.",
  postFailed: "ارسال نظر شما ممکن نشد. دوباره تلاش کنید.",
};

export default strings;
