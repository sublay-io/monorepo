import type { ReportReasonKey } from "@sublay/react-js";

// Russian nouns take one of three forms, depending on the number.
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
  commentPlaceholder: "Добавьте комментарий...",
  cancel: "Отмена",
  post: "Отправить",
  replyingTo: (name: string) => `Ответ для ${name}`,

  // Comment list
  noCommentsTitle: "Комментариев пока нет",
  noCommentsSubtitle: "Начните обсуждение.",
  loadMoreComments: "Загрузить ещё комментарии",
  loading: "Загрузка...",
  loadCommentsFailed: "Не удалось загрузить комментарии",
  loadMoreFailed: "Не удалось загрузить ещё",
  tryAgain: "Повторить",
  sortTop: "Лучшие",
  sortNew: "Новые",
  sortOld: "Старые",

  // A comment
  reply: "Ответить",
  viewMoreReplies: (count: number) => `Показать ещё ответы (${count})`,
  hideReplies: "Скрыть ответы",
  removeYourReaction: "Убрать свою реакцию",
  timeAgo: {
    justNow: "Только что",
    minutes: (count: number) =>
      plural(
        count,
        `${count} минуту назад`,
        `${count} минуты назад`,
        `${count} минут назад`,
      ),
    hours: (count: number) =>
      plural(
        count,
        `${count} час назад`,
        `${count} часа назад`,
        `${count} часов назад`,
      ),
    days: (count: number) =>
      plural(
        count,
        `${count} день назад`,
        `${count} дня назад`,
        `${count} дней назад`,
      ),
    months: (count: number) =>
      plural(
        count,
        `${count} месяц назад`,
        `${count} месяца назад`,
        `${count} месяцев назад`,
      ),
    years: (count: number) =>
      plural(count, `${count} год назад`, `${count} года назад`, `${count} лет назад`),
  },

  // Comments that can't be shown
  deleted: "[удалено]",
  removed: "[скрыто]",
  unavailable: "Этот комментарий недоступен",
  blockedAuthor: "Комментарий пользователя, которого вы заблокировали",
  showAnyway: "Всё равно показать",
  removedByModerator: (reason?: string | null) =>
    `Скрыто модератором${reason ? `: ${reason}` : ""} · видно только вам`,

  // Menus
  report: "Пожаловаться",
  remove: "Удалить",
  confirmDelete: "Удалить этот комментарий?",

  // Report dialog
  reportTitle: "Отправить жалобу",
  reportIntro:
    "Спасибо, что заботитесь о нашем сообществе. Расскажите, что происходит, и мы разберёмся.",
  reportReasons: {
    spam: "Это спам",
    inappropriateContent: "Неприемлемое содержание",
    harassment: "Травля или оскорбления",
    misinformation: "Распространение ложной информации",
    hateSpeech: "Язык вражды или символы ненависти",
    violence: "Призывы к насилию или опасному поведению",
    illegalActivity: "Призывы к незаконным действиям",
    selfHarm: "Призывы к самоповреждению или суициду",
    other: "Другое",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Отправить жалобу",
  submittingReport: "Отправка...",

  // Messages
  loginRequired: "Войдите, чтобы выполнить это действие",
  commentEmpty: "Комментарий не может быть пустым",
  userNotMentionable:
    "Этого пользователя нельзя упомянуть: у него нет имени пользователя",
  parentDeleted: "Этот комментарий удалён, поэтому ответить на него нельзя.",
  parentRemoved: "Этот комментарий скрыт, поэтому ответить на него нельзя.",
  postFailed: "Не удалось опубликовать комментарий. Попробуйте ещё раз.",
};

export default strings;
