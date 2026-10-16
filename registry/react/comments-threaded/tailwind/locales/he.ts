import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "הצטרפו לשיחה",
  replyPlaceholder: "כתבו תגובה...",
  cancel: "ביטול",

  // Comment list
  noCommentsTitle: "אין עדיין תגובות",
  noCommentsSubtitle: "התחילו את השיחה.",
  viewAllComments: "הצגת כל התגובות",
  loadMoreComments: "טעינת תגובות נוספות",
  loading: "טוען...",
  loadCommentsFailed: "לא הצלחנו לטעון את התגובות",
  loadMoreFailed: "לא הצלחנו לטעון עוד",
  tryAgain: "נסו שוב",

  // A comment
  reply: "הגב",
  replyCount: (count: number) =>
    count === 1 ? "תגובה אחת" : count === 2 ? "שתי תגובות" : `${count} תגובות`,
  moreReplyCount: (count: number) =>
    count === 1
      ? "תגובה נוספת אחת"
      : count === 2
        ? "שתי תגובות נוספות"
        : `${count} תגובות נוספות`,
  moreReplies: "תגובות נוספות",
  continueThread: "המשך השרשור",
  expandThread: "הרחבת השרשור",
  collapseThread: "צמצום השרשור",
  moreOptions: "אפשרויות נוספות",
  upvote: "הצבעה בעד",
  downvote: "הצבעה נגד",
  removeYourVote: "הסרת ההצבעה",

  // Comments that can't be shown
  deleted: "[נמחק]",
  removed: "[הוסר]",
  unavailable: "התגובה אינה זמינה",
  blockedAuthor: "תגובה ממשתמש שחסמת",
  showAnyway: "הצג בכל זאת",
  removedByModerator: (reason?: string | null) =>
    `הוסר על ידי מנהל${reason ? `: ${reason}` : ""} · גלוי רק לך`,

  // Mentions
  noUsersFound: "לא נמצאו משתמשים",

  // Menus
  report: "דיווח",
  remove: "מחיקה",
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
  usernameRequired: "יש להגדיר שם משתמש לפני שמגיבים",
  commentEmpty: "אי אפשר לשלוח תגובה ריקה",
  userNotMentionable: "אי אפשר לתייג את המשתמש הזה (לא הוגדר שם משתמש)",
  parentDeleted: "התגובה נמחקה, ולכן אי אפשר להגיב עליה.",
  parentRemoved: "התגובה הוסרה, ולכן אי אפשר להגיב עליה.",
  postFailed: "לא הצלחנו לפרסם את התגובה. נסו שוב.",
};

export default strings;
