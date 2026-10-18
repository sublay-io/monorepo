import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Включете се в разговора",
  cancel: "Отказ",
  replyingTo: "Отговор на",
  cancelReply: "Отказ от отговора",

  // Sorting
  sortBy: "Подреждане по",
  sortSheetTitle: "Подреждане на коментарите по",
  sortTop: "Най-добри",
  sortNew: "Нови",
  sortOld: "Стари",
  sortControversial: "Спорни",

  // When a comment was posted
  timeAgo: {
    justNow: "Току-що",
    minutes: (count: number) =>
      count === 1 ? "преди минута" : `преди ${count} минути`,
    hours: (count: number) =>
      count === 1 ? "преди час" : `преди ${count} часа`,
    days: (count: number) => (count === 1 ? "преди ден" : `преди ${count} дни`),
    months: (count: number) =>
      count === 1 ? "преди месец" : `преди ${count} месеца`,
    years: (count: number) =>
      count === 1 ? "преди година" : `преди ${count} години`,
  },

  // Comment list
  noCommentsTitle: "Все още няма коментари",
  noCommentsSubtitle: "Започнете разговора.",
  viewAllComments: "Показване на всички коментари",
  loadMoreComments: "Зареждане на още коментари",
  loading: "Зареждане...",
  loadCommentsFailed: "Неуспешно зареждане на коментарите",
  loadMoreFailed: "Неуспешно зареждане на още",
  tryAgain: "Опитайте отново",

  // A comment
  reply: "Отговор",
  replyCount: (count: number) =>
    count === 1 ? "1 отговор" : `${count} отговора`,
  moreReplyCount: (count: number) =>
    count === 1 ? "още 1 отговор" : `още ${count} отговора`,
  moreReplies: "Още отговори",
  removeYourVote: "Премахване на гласа ви",

  // Comments that can't be shown
  deleted: "[изтрито]",
  removed: "[премахнато]",
  unavailable: "Този коментар не е достъпен",
  blockedAuthor: "Коментар от потребител, когото сте блокирали",
  showAnyway: "Показване въпреки това",
  removedByModerator: (reason?: string | null) =>
    `Премахнато от модератор${reason ? `: ${reason}` : ""} · виждате го само вие`,

  // Mentions
  noUsersFound: "Няма намерени потребители",

  // Menus
  report: "Сигнализиране",
  delete: "Изтриване",
  deleteCommentTitle: "Изтриване на коментара",
  confirmDelete: "Наистина ли искате да изтриете този коментар?",

  // Report dialog
  reportTitle: "Подаване на сигнал",
  reportIntro:
    "Благодарим ви, че се грижите за нашата общност. Разкажете ни какво се случва и ние ще проверим.",
  reportReasons: {
    spam: "Спам",
    inappropriateContent: "Неподходящо съдържание",
    harassment: "Тормоз или обиди",
    misinformation: "Разпространява невярна информация",
    hateSpeech: "Език на омразата или символи на омраза",
    violence: "Насърчава насилие или опасно поведение",
    illegalActivity: "Насърчава незаконна дейност",
    selfHarm: "Насърчава самонараняване или самоубийство",
    other: "Друго",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Изпращане на сигнала",
  submittingReport: "Изпращане...",

  // Messages
  parentDeleted: "Този коментар е изтрит, затова не можете да отговорите на него.",
  parentRemoved: "Този коментар е премахнат, затова не можете да отговорите на него.",
  postFailed: "Коментарът ви не беше публикуван. Опитайте отново.",
};

export default strings;
