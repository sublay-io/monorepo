import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Bli med i samtalen",
  cancel: "Avbryt",
  replyingTo: "Svarer",
  cancelReply: "Avbryt svar",
  collapseThread: "Skjul tråden",
  expandThread: "Utvid tråden",

  // Sorting
  sortBy: "Sorter etter",
  sortSheetTitle: "Sorter kommentarer etter",
  sortTop: "Topp",
  sortNew: "Nyeste",
  sortOld: "Eldste",
  sortControversial: "Kontroversielle",

  // When a comment was posted
  timeAgo: {
    justNow: "Akkurat nå",
    minutes: (count: number) =>
      count === 1 ? "for ett minutt siden" : `for ${count} minutter siden`,
    hours: (count: number) =>
      count === 1 ? "for en time siden" : `for ${count} timer siden`,
    days: (count: number) =>
      count === 1 ? "for en dag siden" : `for ${count} dager siden`,
    months: (count: number) =>
      count === 1 ? "for en måned siden" : `for ${count} måneder siden`,
    years: (count: number) =>
      count === 1 ? "for ett år siden" : `for ${count} år siden`,
  },

  // Comment list
  noCommentsTitle: "Ingen kommentarer ennå",
  noCommentsSubtitle: "Start samtalen.",
  viewAllComments: "Se alle kommentarer",
  loadMoreComments: "Last inn flere kommentarer",
  loading: "Laster inn...",
  loadCommentsFailed: "Kunne ikke laste inn kommentarene",
  loadMoreFailed: "Kunne ikke laste inn flere",
  tryAgain: "Prøv igjen",

  // A comment
  reply: "Svar",
  replyCount: (count: number) => `${count} svar`,
  moreReplyCount: (count: number) => `${count} svar til`,
  moreReplies: "Flere svar",
  removeYourVote: "Fjern stemmen din",

  // Comments that can't be shown
  deleted: "[slettet]",
  removed: "[fjernet]",
  unavailable: "Denne kommentaren er ikke tilgjengelig",
  blockedAuthor: "Kommentar fra en bruker du har blokkert",
  showAnyway: "Vis likevel",
  removedByModerator: (reason?: string | null) =>
    `Fjernet av en moderator${reason ? `: ${reason}` : ""} · bare du kan se dette`,

  // Mentions
  noUsersFound: "Ingen brukere funnet",

  // Menus
  report: "Rapporter",
  delete: "Slett",
  deleteCommentTitle: "Slett kommentar",
  confirmDelete: "Er du sikker på at du vil slette denne kommentaren?",

  // Report dialog
  reportTitle: "Send inn en rapport",
  reportIntro:
    "Takk for at du passer på fellesskapet vårt. Fortell oss hva som skjer, så ser vi på det.",
  reportReasons: {
    spam: "Det er spam",
    inappropriateContent: "Inneholder upassende innhold",
    harassment: "Det er trakassering eller mobbing",
    misinformation: "Sprer falsk informasjon",
    hateSpeech: "Inneholder hatefulle ytringer eller symboler",
    violence: "Oppfordrer til vold eller farlig atferd",
    illegalActivity: "Oppfordrer til ulovlig aktivitet",
    selfHarm: "Oppfordrer til selvskading eller selvmord",
    other: "Annet",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Send rapport",
  submittingReport: "Sender...",

  // Messages
  parentDeleted: "Denne kommentaren er slettet, så du kan ikke svare på den.",
  parentRemoved: "Denne kommentaren er fjernet, så du kan ikke svare på den.",
  postFailed: "Kunne ikke publisere kommentaren din. Prøv igjen.",
};

export default strings;
