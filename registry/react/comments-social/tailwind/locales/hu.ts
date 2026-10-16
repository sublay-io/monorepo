import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Írj egy hozzászólást...",
  cancel: "Mégse",
  post: "Közzététel",
  replyingTo: (name: string) => `Válasz neki: ${name}`,

  // Comment list
  noCommentsTitle: "Még nincsenek hozzászólások",
  noCommentsSubtitle: "Kezdd el a beszélgetést.",
  loadMoreComments: "További hozzászólások betöltése",
  loading: "Betöltés...",
  loadCommentsFailed: "Nem sikerült betölteni a hozzászólásokat",
  loadMoreFailed: "Nem sikerült többet betölteni",
  tryAgain: "Próbáld újra",
  sortTop: "Legjobb",
  sortNew: "Legújabb",
  sortOld: "Legrégebbi",

  // A comment
  reply: "Válasz",
  viewMoreReplies: (count: number) => `További válaszok megtekintése (${count})`,
  hideReplies: "Válaszok elrejtése",
  removeYourReaction: "Reakció visszavonása",
  timeAgo: {
    justNow: "Épp most",
    minutes: (count: number) => (count === 1 ? "egy perce" : `${count} perce`),
    hours: (count: number) => (count === 1 ? "egy órája" : `${count} órája`),
    days: (count: number) => (count === 1 ? "egy napja" : `${count} napja`),
    months: (count: number) =>
      count === 1 ? "egy hónapja" : `${count} hónapja`,
    years: (count: number) => (count === 1 ? "egy éve" : `${count} éve`),
  },

  // Comments that can't be shown
  deleted: "[törölve]",
  removed: "[eltávolítva]",
  unavailable: "Ez a hozzászólás nem érhető el",
  blockedAuthor: "Egy általad letiltott felhasználó hozzászólása",
  showAnyway: "Megjelenítés mindenképp",
  removedByModerator: (reason?: string | null) =>
    `Egy moderátor eltávolította${reason ? `: ${reason}` : ""} · csak te látod`,

  // Menus
  report: "Jelentés",
  remove: "Törlés",
  confirmDelete: "Biztosan törlöd ezt a hozzászólást?",

  // Report dialog
  reportTitle: "Jelentés küldése",
  reportIntro:
    "Köszönjük, hogy vigyázol a közösségünkre. Mondd el, mi történik, és utánanézünk.",
  reportReasons: {
    spam: "Ez spam",
    inappropriateContent: "Nem helyénvaló tartalom van benne",
    harassment: "Zaklatás vagy megfélemlítés",
    misinformation: "Hamis információt terjeszt",
    hateSpeech: "Gyűlöletbeszédet vagy gyűlöletkeltő szimbólumokat tartalmaz",
    violence: "Erőszakra vagy veszélyes viselkedésre buzdít",
    illegalActivity: "Illegális tevékenységre buzdít",
    selfHarm: "Önsértésre vagy öngyilkosságra buzdít",
    other: "Egyéb",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Jelentés küldése",
  submittingReport: "Küldés...",

  // Messages
  loginRequired: "A művelethez jelentkezz be",
  commentEmpty: "A hozzászólás nem lehet üres",
  userNotMentionable:
    "Ennek a felhasználónak nincs felhasználóneve, ezért nem említhető meg",
  parentDeleted: "Ezt a hozzászólást törölték, ezért nem válaszolhatsz rá.",
  parentRemoved: "Ezt a hozzászólást eltávolították, ezért nem válaszolhatsz rá.",
  postFailed: "Nem sikerült közzétenni a hozzászólásodat. Próbáld újra.",
};

export default strings;
