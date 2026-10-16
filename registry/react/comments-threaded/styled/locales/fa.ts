import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "به گفت‌وگو بپیوندید",
  replyPlaceholder: "پاسخ خود را بنویسید...",
  cancel: "لغو",

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
  continueThread: "ادامهٔ این رشته",
  expandThread: "باز کردن رشته",
  collapseThread: "بستن رشته",
  moreOptions: "گزینه‌های بیشتر",
  upvote: "رأی مثبت",
  downvote: "رأی منفی",
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
  remove: "حذف",
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
  loginRequired: "برای انجام این کار وارد حساب خود شوید",
  usernameRequired:
    "برای تعامل با نظرها، ابتدا یک نام کاربری انتخاب کنید",
  commentEmpty: "نظر نمی‌تواند خالی باشد",
  userNotMentionable:
    "نمی‌توان به این کاربر اشاره کرد (نام کاربری ندارد)",
  parentDeleted:
    "این نظر حذف شده است، بنابراین نمی‌توانید به آن پاسخ دهید.",
  parentRemoved:
    "این نظر برداشته شده است، بنابراین نمی‌توانید به آن پاسخ دهید.",
  postFailed: "ارسال نظر شما ممکن نشد. دوباره تلاش کنید.",
};

export default strings;
