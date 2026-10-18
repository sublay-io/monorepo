import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Csatlakozz a beszélgetéshez",
  cancel: "Mégse",
  replyingTo: "Válasz neki:",
  cancelReply: "Válasz elvetése",

  // Sorting
  sortBy: "Rendezés",
  sortSheetTitle: "Hozzászólások rendezése",
  sortTop: "Legjobb",
  sortNew: "Legújabb",
  sortOld: "Legrégebbi",
  sortControversial: "Megosztó",

  // Comment list
  noCommentsTitle: "Még nincsenek hozzászólások",
  noCommentsSubtitle: "Kezdd el a beszélgetést.",
  viewAllComments: "Az összes hozzászólás megtekintése",
  loadMoreComments: "További hozzászólások betöltése",
  loading: "Betöltés...",
  loadCommentsFailed: "Nem sikerült betölteni a hozzászólásokat",
  loadMoreFailed: "Nem sikerült többet betölteni",
  tryAgain: "Próbáld újra",

  // A comment
  reply: "Válasz",
  replyCount: (count: number) => `${count} válasz`,
  moreReplyCount: (count: number) => `még ${count} válasz`,
  moreReplies: "További válaszok",
  removeYourVote: "Szavazat visszavonása",

  // Comments that can't be shown
  deleted: "[törölve]",
  removed: "[eltávolítva]",
  unavailable: "Ez a hozzászólás nem érhető el",
  blockedAuthor: "Egy általad letiltott felhasználó hozzászólása",
  showAnyway: "Megjelenítés mindenképp",
  removedByModerator: (reason?: string | null) =>
    `Egy moderátor eltávolította${reason ? `: ${reason}` : ""} · csak te látod`,

  // Mentions
  noUsersFound: "Nem található felhasználó",

  // Menus
  report: "Jelentés",
  delete: "Törlés",
  deleteCommentTitle: "Hozzászólás törlése",
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
  parentDeleted: "Ezt a hozzászólást törölték, ezért nem válaszolhatsz rá.",
  parentRemoved: "Ezt a hozzászólást eltávolították, ezért nem válaszolhatsz rá.",
  postFailed: "Nem sikerült közzétenni a hozzászólásodat. Próbáld újra.",
};

export default strings;
