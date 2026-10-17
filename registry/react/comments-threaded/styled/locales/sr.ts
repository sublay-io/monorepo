import type { ReportReasonKey } from "@sublay/react-js";

// Serbian nouns take one of three forms, depending on the number.
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
  commentPlaceholder: "Укључи се у разговор",
  replyPlaceholder: "Напиши одговор...",
  cancel: "Откажи",
  submitComment: "Објави",
  addGif: "Додај GIF",

  // Sorting
  sortBy: "Сортирај по",
  sortTop: "Најбољи",
  sortNew: "Најновији",
  sortOld: "Најстарији",
  sortControversial: "Контроверзни",

  // Comment list
  noCommentsTitle: "Још нема коментара",
  noCommentsSubtitle: "Започни разговор.",
  viewAllComments: "Прикажи све коментаре",
  loadMoreComments: "Учитај још коментара",
  loading: "Учитавање...",
  loadCommentsFailed: "Учитавање коментара није успело",
  loadMoreFailed: "Учитавање није успело",
  tryAgain: "Покушај поново",

  // A comment
  reply: "Одговори",
  replyCount: (count: number) =>
    plural(
      count,
      `${count} одговор`,
      `${count} одговора`,
      `${count} одговора`,
    ),
  moreReplyCount: (count: number) =>
    plural(
      count,
      `још ${count} одговор`,
      `још ${count} одговора`,
      `још ${count} одговора`,
    ),
  moreReplies: "Још одговора",
  continueThread: "Настави нит",
  expandThread: "Прошири нит",
  collapseThread: "Скупи нит",
  moreOptions: "Још опција",
  upvote: "Гласај за",
  downvote: "Гласај против",
  removeYourVote: "Уклони свој глас",

  // Comments that can't be shown
  deleted: "[обрисано]",
  removed: "[уклоњено]",
  unavailable: "Овај коментар није доступан",
  blockedAuthor: "Коментар блокираног корисника",
  showAnyway: "Ипак прикажи",
  removedByModerator: (reason?: string | null) =>
    `Уклонио модератор${reason ? `: ${reason}` : ""} · видљиво само теби`,

  // Mentions
  noUsersFound: "Нема пронађених корисника",

  // Menus
  report: "Пријави",
  remove: "Обриши",
  confirmDelete: "Да ли сигурно желиш да обришеш овај коментар?",

  // Report dialog
  reportTitle: "Пошаљи пријаву",
  reportIntro:
    "Хвала што бринеш о нашој заједници. Реци нам шта се дешава и проверићемо.",
  reportReasons: {
    spam: "Ово је спам",
    inappropriateContent: "Неприкладан садржај",
    harassment: "Узнемиравање или малтретирање",
    misinformation: "Шири лажне информације",
    hateSpeech: "Говор мржње или симболи мржње",
    violence: "Подстиче насиље или опасно понашање",
    illegalActivity: "Подстиче незакониту активност",
    selfHarm: "Подстиче самоповређивање или самоубиство",
    other: "Друго",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Пошаљи пријаву",
  submittingReport: "Слање...",

  // Messages
  loginRequired: "За ову радњу мораш да се пријавиш",
  usernameRequired: "Пре коментарисања подеси корисничко име",
  commentEmpty: "Коментар не може бити празан",
  userNotMentionable:
    "Овај корисник не може да се помене (нема корисничко име)",
  parentDeleted: "Овај коментар је обрисан, па не можеш да одговориш на њега.",
  parentRemoved: "Овај коментар је уклоњен, па не можеш да одговориш на њега.",
  postFailed: "Објављивање коментара није успело. Покушај поново.",
};

export default strings;
