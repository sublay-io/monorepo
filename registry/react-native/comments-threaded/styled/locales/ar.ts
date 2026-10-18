import type { ReportReasonKey } from "@sublay/react-native";

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
  commentPlaceholder: "انضم إلى النقاش",
  cancel: "إلغاء",
  replyingTo: "ردًا على",
  cancelReply: "إلغاء الرد",

  // Sorting
  sortBy: "ترتيب حسب",
  sortSheetTitle: "ترتيب التعليقات حسب",
  sortTop: "الأبرز",
  sortNew: "الأحدث",
  sortOld: "الأقدم",
  sortControversial: "مثيرة للجدل",

  // Comment list
  noCommentsTitle: "لا توجد تعليقات بعد",
  noCommentsSubtitle: "ابدأ النقاش.",
  viewAllComments: "عرض كل التعليقات",
  loadMoreComments: "تحميل المزيد من التعليقات",
  loading: "جارٍ التحميل...",
  loadCommentsFailed: "تعذّر تحميل التعليقات",
  loadMoreFailed: "تعذّر تحميل المزيد",
  tryAgain: "إعادة المحاولة",

  // A comment
  reply: "رد",
  replyCount: (count: number) =>
    plural(count, "رد واحد", "ردّان", `${count} ردود`, `${count} ردًا`, `${count} رد`),
  moreReplyCount: (count: number) =>
    plural(
      count,
      "رد آخر",
      "ردّان آخران",
      `${count} ردود أخرى`,
      `${count} ردًا آخر`,
      `${count} رد آخر`,
    ),
  moreReplies: "ردود أخرى",
  removeYourVote: "إزالة تصويتك",

  // Comments that can't be shown
  deleted: "[محذوف]",
  removed: "[تمت الإزالة]",
  unavailable: "هذا التعليق غير متاح",
  blockedAuthor: "تعليق من مستخدم حظرته",
  showAnyway: "عرض على أي حال",
  removedByModerator: (reason?: string | null) =>
    `أزاله أحد المشرفين${reason ? `: ${reason}` : ""} · يظهر لك فقط`,

  // Mentions
  noUsersFound: "لم يُعثر على مستخدمين",

  // Menus
  report: "إبلاغ",
  delete: "حذف",
  deleteCommentTitle: "حذف التعليق",
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
  parentDeleted: "حُذف هذا التعليق، لذا لا يمكنك الرد عليه.",
  parentRemoved: "أُزيل هذا التعليق، لذا لا يمكنك الرد عليه.",
  postFailed: "تعذّر نشر تعليقك. حاول مرة أخرى.",
};

export default strings;
