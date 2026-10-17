import type { ReportReasonKey } from "@sublay/react-js";

// Ukrainian nouns take one of three forms, depending on the number.
const plural = (count: number, one: string, few: string, many: string) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Долучайтеся до обговорення",
  replyPlaceholder: "Напишіть відповідь...",
  cancel: "Скасувати",
  submitComment: "Опублікувати",
  addGif: "Додати GIF",

  // Sorting
  sortBy: "Сортувати за",
  sortTop: "Найкращі",
  sortNew: "Нові",
  sortOld: "Старі",
  sortControversial: "Суперечливі",

  // Comment list
  noCommentsTitle: "Коментарів поки немає",
  noCommentsSubtitle: "Почніть обговорення.",
  viewAllComments: "Показати всі коментарі",
  loadMoreComments: "Завантажити ще коментарі",
  loading: "Завантаження...",
  loadCommentsFailed: "Не вдалося завантажити коментарі",
  loadMoreFailed: "Не вдалося завантажити ще",
  tryAgain: "Спробувати ще раз",

  // A comment
  reply: "Відповісти",
  replyCount: (count: number) =>
    plural(count, `${count} відповідь`, `${count} відповіді`, `${count} відповідей`),
  moreReplyCount: (count: number) =>
    plural(count, `ще ${count} відповідь`, `ще ${count} відповіді`, `ще ${count} відповідей`),
  moreReplies: "Ще відповіді",
  continueThread: "Продовжити гілку",
  expandThread: "Розгорнути гілку",
  collapseThread: "Згорнути гілку",
  moreOptions: "Більше дій",
  upvote: "Голос «за»",
  downvote: "Голос «проти»",
  removeYourVote: "Прибрати свій голос",

  // Comments that can't be shown
  deleted: "[видалено]",
  removed: "[приховано]",
  unavailable: "Цей коментар недоступний",
  blockedAuthor: "Коментар користувача, якого ви заблокували",
  showAnyway: "Усе одно показати",
  removedByModerator: (reason?: string | null) =>
    `Приховано модератором${reason ? `: ${reason}` : ""} · бачите лише ви`,

  // Mentions
  noUsersFound: "Користувачів не знайдено",

  // Menus
  report: "Поскаржитися",
  remove: "Видалити",
  confirmDelete: "Видалити цей коментар?",

  // Report dialog
  reportTitle: "Надіслати скаргу",
  reportIntro:
    "Дякуємо, що дбаєте про нашу спільноту. Розкажіть, що сталося, і ми розберемося.",
  reportReasons: {
    spam: "Це спам",
    inappropriateContent: "Неприйнятний вміст",
    harassment: "Цькування або образи",
    misinformation: "Поширення неправдивої інформації",
    hateSpeech: "Мова ворожнечі або символи ненависті",
    violence: "Заклики до насильства або небезпечної поведінки",
    illegalActivity: "Заклики до незаконних дій",
    selfHarm: "Заклики до самоушкодження або суїциду",
    other: "Інше",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Надіслати скаргу",
  submittingReport: "Надсилання...",

  // Messages
  loginRequired: "Увійдіть, щоб виконати цю дію",
  usernameRequired: "Укажіть ім’я користувача, щоб брати участь в обговоренні",
  commentEmpty: "Коментар не може бути порожнім",
  userNotMentionable: "Цього користувача не можна згадати (не вказано ім’я користувача)",
  parentDeleted: "Цей коментар видалено, тому відповісти на нього не можна.",
  parentRemoved: "Цей коментар приховано, тому відповісти на нього не можна.",
  postFailed: "Не вдалося опублікувати коментар. Спробуйте ще раз.",
};

export default strings;
