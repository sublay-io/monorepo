import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "הוסיפו תגובה...",
  cancel: "ביטול",
  post: "פרסום",
  replyingTo: (name: string) => `בתגובה אל ${name}`,

  // Comment list
  noCommentsTitle: "אין עדיין תגובות",
  noCommentsSubtitle: "התחילו את השיחה.",
  loadMoreComments: "טעינת תגובות נוספות",
  loading: "טוען...",
  loadCommentsFailed: "לא הצלחנו לטעון את התגובות",
  loadMoreFailed: "לא הצלחנו לטעון עוד",
  tryAgain: "נסו שוב",
  sortTop: "מובילות",
  sortNew: "חדשות",
  sortOld: "ישנות",

  // A comment
  reply: "הגב",
  viewMoreReplies: (count: number) => `הצגת תגובות נוספות (${count})`,
  hideReplies: "הסתרת התגובות",
  removeYourReaction: "הסרת הסימון שלך",
  timeAgo: {
    justNow: "עכשיו",
    minutes: (count: number) =>
      count === 1 ? "לפני דקה" : count === 2 ? "לפני שתי דקות" : `לפני ${count} דקות`,
    hours: (count: number) =>
      count === 1 ? "לפני שעה" : count === 2 ? "לפני שעתיים" : `לפני ${count} שעות`,
    days: (count: number) =>
      count === 1 ? "לפני יום" : count === 2 ? "לפני יומיים" : `לפני ${count} ימים`,
    months: (count: number) =>
      count === 1 ? "לפני חודש" : count === 2 ? "לפני חודשיים" : `לפני ${count} חודשים`,
    years: (count: number) =>
      count === 1 ? "לפני שנה" : count === 2 ? "לפני שנתיים" : `לפני ${count} שנים`,
  },

  // Comments that can't be shown
  deleted: "[נמחק]",
  removed: "[הוסר]",
  unavailable: "התגובה אינה זמינה",
  blockedAuthor: "תגובה ממשתמש שחסמת",
  showAnyway: "הצג בכל זאת",
  removedByModerator: (reason?: string | null) =>
    `הוסר על ידי מנהל${reason ? `: ${reason}` : ""} · גלוי רק לך`,

  // Menus
  report: "דיווח",
  remove: "הסרה",
  confirmDelete: "למחוק את התגובה?",

  // Report dialog
  reportTitle: "שליחת דיווח",
  reportIntro: "תודה ששומרים על הקהילה שלנו. ספרו לנו מה קורה ונבדוק את זה.",
  reportReasons: {
    spam: "ספאם",
    inappropriateContent: "תוכן לא הולם",
    harassment: "הטרדה או בריונות",
    misinformation: "הפצת מידע כוזב",
    hateSpeech: "דברי שנאה או סמלי שנאה",
    violence: "עידוד אלימות או התנהגות מסוכנת",
    illegalActivity: "עידוד פעילות בלתי חוקית",
    selfHarm: "עידוד פגיעה עצמית או התאבדות",
    other: "אחר",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "שליחת הדיווח",
  submittingReport: "שולח..",

  // Messages
  loginRequired: "יש להתחבר כדי לבצע פעולה זו",
  commentEmpty: "אי אפשר לשלוח תגובה ריקה",
  userNotMentionable: "אי אפשר לתייג את המשתמש הזה (לא הוגדר שם משתמש)",
  parentDeleted: "התגובה נמחקה, ולכן אי אפשר להגיב עליה.",
  parentRemoved: "התגובה הוסרה, ולכן אי אפשר להגיב עליה.",
  postFailed: "לא הצלחנו לפרסם את התגובה. נסו שוב.",
};

export default strings;
