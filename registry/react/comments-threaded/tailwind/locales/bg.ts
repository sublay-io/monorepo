import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Включете се в разговора",
  replyPlaceholder: "Напишете отговор...",
  cancel: "Отказ",
  submitComment: "Публикуване",
  addGif: "Добавяне на GIF",

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
  continueThread: "Продължаване на нишката",
  expandThread: "Разгъване на нишката",
  collapseThread: "Свиване на нишката",
  moreOptions: "Още опции",
  upvote: "Глас „за“",
  downvote: "Глас „против“",
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
  usernameRequired: "Задайте потребителско име, за да участвате в коментарите",
  commentEmpty: "Коментарът не може да е празен",
  userNotMentionable: "Този потребител не може да бъде споменат (няма потребителско име)",
  parentDeleted: "Този коментар е изтрит, затова не можете да отговорите на него.",
  parentRemoved: "Този коментар е премахнат, затова не можете да отговорите на него.",
  postFailed: "Коментарът ви не беше публикуван. Опитайте отново.",
};

export default strings;
