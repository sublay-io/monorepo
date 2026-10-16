import type { ReportReasonKey } from "@sublay/react-native";

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
  commentPlaceholder: "Додај коментар...",
  cancel: "Откажи",
  post: "Објави",
  replyingTo: (name: string) => `Одговор кориснику ${name}`,

  // Comment list
  noCommentsTitle: "Још нема коментара",
  noCommentsSubtitle: "Започни разговор.",
  loadCommentsFailed: "Учитавање коментара није успело",
  loadMoreFailed: "Учитавање није успело",
  tryAgain: "Покушај поново",
  sortTop: "Најбољи",
  sortNew: "Најновији",
  sortOld: "Најстарији",

  // A comment
  reply: "Одговори",
  viewMoreReplies: (count: number) =>
    plural(
      count,
      `Прикажи још ${count} одговор`,
      `Прикажи још ${count} одговора`,
      `Прикажи још ${count} одговора`,
    ),
  hideReplies: "Сакриј одговоре",
  removeYourReaction: "Уклони своју реакцију",
  timeAgo: {
    justNow: "Управо сада",
    minutes: (count: number) =>
      plural(
        count,
        `пре ${count} минута`,
        `пре ${count} минута`,
        `пре ${count} минута`,
      ),
    hours: (count: number) =>
      plural(
        count,
        `пре ${count} сата`,
        `пре ${count} сата`,
        `пре ${count} сати`,
      ),
    days: (count: number) =>
      plural(
        count,
        `пре ${count} дана`,
        `пре ${count} дана`,
        `пре ${count} дана`,
      ),
    months: (count: number) =>
      plural(
        count,
        `пре ${count} месеца`,
        `пре ${count} месеца`,
        `пре ${count} месеци`,
      ),
    years: (count: number) =>
      plural(
        count,
        `пре ${count} године`,
        `пре ${count} године`,
        `пре ${count} година`,
      ),
  },

  // Comments that can't be shown
  deleted: "[обрисано]",
  removed: "[уклоњено]",
  unavailable: "Овај коментар није доступан",
  blockedAuthor: "Коментар блокираног корисника",
  showAnyway: "Ипак прикажи",
  removedByModerator: (reason?: string | null) =>
    `Уклонио модератор${reason ? `: ${reason}` : ""} · видљиво само теби`,

  // Menus
  report: "Пријави",
  delete: "Обриши",
  deleteCommentTitle: "Обриши коментар",
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
  parentDeleted: "Овај коментар је обрисан, па не можеш да одговориш на њега.",
  parentRemoved: "Овај коментар је уклоњен, па не можеш да одговориш на њега.",
  postFailed: "Објављивање коментара није успело. Покушај поново.",
};

export default strings;
