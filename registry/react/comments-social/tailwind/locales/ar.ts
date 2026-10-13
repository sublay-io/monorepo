import type { ReportReasonKey } from "@sublay/react-js";

// Arabic nouns take one of five forms, depending on the number.
const plural = (
  count: number,
  one: string,
  two: string,
  few: string,
  many: string,
  other: string
) => {
  const mod100 = count % 100;
  if (count === 1) return one;
  if (count === 2) return two;
  if (mod100 >= 3 && mod100 <= 10) return few;
  if (mod100 >= 11) return many;
  return other;
};

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "أضف تعليقًا...",
  cancel: "إلغاء",
  post: "نشر",
  replyingTo: (name: string) => `ردًا على ${name}`,

  // Comment list
  noCommentsTitle: "لا توجد تعليقات بعد",
  noCommentsSubtitle: "ابدأ النقاش.",
  loadMoreComments: "تحميل المزيد من التعليقات",
  loading: "جارٍ التحميل...",
  loadCommentsFailed: "تعذّر تحميل التعليقات",
  loadMoreFailed: "تعذّر تحميل المزيد",
  tryAgain: "إعادة المحاولة",
  sortTop: "الأبرز",
  sortNew: "الأحدث",
  sortOld: "الأقدم",

  // A comment
  reply: "رد",
  viewMoreReplies: (count: number) => `عرض ردود أخرى (${count})`,
  hideReplies: "إخفاء الردود",
  removeYourReaction: "إزالة تفاعلك",
  timeAgo: {
    justNow: "الآن",
    minutes: (count: number) =>
      plural(
        count,
        "قبل دقيقة",
        "قبل دقيقتين",
        `قبل ${count} دقائق`,
        `قبل ${count} دقيقة`,
        `قبل ${count} دقيقة`,
      ),
    hours: (count: number) =>
      plural(
        count,
        "قبل ساعة",
        "قبل ساعتين",
        `قبل ${count} ساعات`,
        `قبل ${count} ساعة`,
        `قبل ${count} ساعة`,
      ),
    days: (count: number) =>
      plural(
        count,
        "قبل يوم",
        "قبل يومين",
        `قبل ${count} أيام`,
        `قبل ${count} يومًا`,
        `قبل ${count} يوم`,
      ),
    months: (count: number) =>
      plural(
        count,
        "قبل شهر",
        "قبل شهرين",
        `قبل ${count} أشهر`,
        `قبل ${count} شهرًا`,
        `قبل ${count} شهر`,
      ),
    years: (count: number) =>
      plural(
        count,
        "قبل سنة",
        "قبل سنتين",
        `قبل ${count} سنوات`,
        `قبل ${count} سنة`,
        `قبل ${count} سنة`,
      ),
  },

  // Comments that can't be shown
  deleted: "[محذوف]",
  removed: "[تمت الإزالة]",
  unavailable: "هذا التعليق غير متاح",
  blockedAuthor: "تعليق من مستخدم حظرته",
  showAnyway: "عرض على أي حال",
  removedByModerator: (reason?: string | null) =>
    `أزاله أحد المشرفين${reason ? `: ${reason}` : ""} · يظهر لك فقط`,

  // Menus
  report: "إبلاغ",
  remove: "حذف",
  confirmDelete: "هل تريد حذف هذا التعليق بالتأكيد؟",

  // Report dialog
  reportTitle: "إرسال بلاغ",
  reportIntro: "شكرًا لحرصك على مجتمعنا. أخبرنا بما يحدث وسننظر في الأمر.",
  reportReasons: {
    spam: "محتوى مزعج",
    inappropriateContent: "يتضمن محتوى غير لائق",
    harassment: "مضايقة أو تنمّر",
    misinformation: "ينشر معلومات مضللة",
    hateSpeech: "يتضمن خطاب كراهية أو رموزها",
    violence: "يروّج للعنف أو لسلوك خطير",
    illegalActivity: "يروّج لنشاط غير قانوني",
    selfHarm: "يروّج لإيذاء النفس أو الانتحار",
    other: "غير ذلك",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "إرسال البلاغ",
  submittingReport: "جارٍ الإرسال...",

  // Messages
  loginRequired: "سجّل الدخول لتنفيذ هذا الإجراء",
  commentEmpty: "لا يمكن أن يكون التعليق فارغًا",
  userNotMentionable: "لا يمكن الإشارة إلى هذا المستخدم لأنه لا يملك اسم مستخدم",
  parentDeleted: "حُذف هذا التعليق، لذا لا يمكنك الرد عليه.",
  parentRemoved: "أُزيل هذا التعليق، لذا لا يمكنك الرد عليه.",
  postFailed: "تعذّر نشر تعليقك. حاول مرة أخرى.",
};

export default strings;
