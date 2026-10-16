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
  commentPlaceholder: "Додайте коментар...",
  cancel: "Скасувати",
  post: "Надіслати",
  replyingTo: (name: string) => `Відповідь для ${name}`,

  // Comment list
  noCommentsTitle: "Коментарів поки немає",
  noCommentsSubtitle: "Почніть обговорення.",
  loadMoreComments: "Завантажити ще коментарі",
  loading: "Завантаження...",
  loadCommentsFailed: "Не вдалося завантажити коментарі",
  loadMoreFailed: "Не вдалося завантажити ще",
  tryAgain: "Спробувати ще раз",
  sortTop: "Найкращі",
  sortNew: "Нові",
  sortOld: "Старі",

  // A comment
  reply: "Відповісти",
  viewMoreReplies: (count: number) => `Показати ще відповіді (${count})`,
  hideReplies: "Сховати відповіді",
  removeYourReaction: "Прибрати свою реакцію",
  timeAgo: {
    justNow: "Щойно",
    minutes: (count: number) =>
      plural(count, `${count} хвилину тому`, `${count} хвилини тому`, `${count} хвилин тому`),
    hours: (count: number) =>
      plural(count, `${count} годину тому`, `${count} години тому`, `${count} годин тому`),
    days: (count: number) =>
      plural(count, `${count} день тому`, `${count} дні тому`, `${count} днів тому`),
    months: (count: number) =>
      plural(count, `${count} місяць тому`, `${count} місяці тому`, `${count} місяців тому`),
    years: (count: number) =>
      plural(count, `${count} рік тому`, `${count} роки тому`, `${count} років тому`),
  },

  // Comments that can't be shown
  deleted: "[видалено]",
  removed: "[приховано]",
  unavailable: "Цей коментар недоступний",
  blockedAuthor: "Коментар користувача, якого ви заблокували",
  showAnyway: "Усе одно показати",
  removedByModerator: (reason?: string | null) =>
    `Приховано модератором${reason ? `: ${reason}` : ""} · бачите лише ви`,

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
  commentEmpty: "Коментар не може бути порожнім",
  userNotMentionable:
    "Цього користувача не можна згадати: у нього немає імені користувача",
  parentDeleted: "Цей коментар видалено, тому відповісти на нього не можна.",
  parentRemoved: "Цей коментар приховано, тому відповісти на нього не можна.",
  postFailed: "Не вдалося опублікувати коментар. Спробуйте ще раз.",
};

export default strings;
