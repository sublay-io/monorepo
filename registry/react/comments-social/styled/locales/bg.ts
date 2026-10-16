import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Добавете коментар...",
  cancel: "Отказ",
  post: "Публикуване",
  replyingTo: (name: string) => `Отговор на ${name}`,

  // Comment list
  noCommentsTitle: "Все още няма коментари",
  noCommentsSubtitle: "Започнете разговора.",
  loadMoreComments: "Зареждане на още коментари",
  loading: "Зареждане...",
  loadCommentsFailed: "Неуспешно зареждане на коментарите",
  loadMoreFailed: "Неуспешно зареждане на още",
  tryAgain: "Опитайте отново",
  sortTop: "Най-добри",
  sortNew: "Нови",
  sortOld: "Стари",

  // A comment
  reply: "Отговор",
  viewMoreReplies: (count: number) => `Вижте още отговори (${count})`,
  hideReplies: "Скриване на отговорите",
  removeYourReaction: "Премахване на реакцията ви",
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

  // Comments that can't be shown
  deleted: "[изтрито]",
  removed: "[премахнато]",
  unavailable: "Този коментар не е достъпен",
  blockedAuthor: "Коментар от потребител, когото сте блокирали",
  showAnyway: "Показване въпреки това",
  removedByModerator: (reason?: string | null) =>
    `Премахнато от модератор${reason ? `: ${reason}` : ""} · виждате го само вие`,

  // Menus
  report: "Сигнализиране",
  remove: "Изтриване",
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
  loginRequired: "Влезте в профила си, за да извършите това действие",
  commentEmpty: "Коментарът не може да е празен",
  userNotMentionable:
    "Този потребител няма потребителско име и не може да бъде споменат",
  parentDeleted: "Този коментар е изтрит, затова не можете да отговорите на него.",
  parentRemoved: "Този коментар е премахнат, затова не можете да отговорите на него.",
  postFailed: "Коментарът ви не беше публикуван. Опитайте отново.",
};

export default strings;
