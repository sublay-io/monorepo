import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Skriv en kommentar...",
  cancel: "Avbryt",
  post: "Publiser",
  replyingTo: (name: string) => `Svarer ${name}`,

  // Comment list
  noCommentsTitle: "Ingen kommentarer ennå",
  noCommentsSubtitle: "Start samtalen.",
  loadMoreComments: "Last inn flere kommentarer",
  loading: "Laster inn...",
  loadCommentsFailed: "Kunne ikke laste inn kommentarene",
  loadMoreFailed: "Kunne ikke laste inn flere",
  tryAgain: "Prøv igjen",
  sortTop: "Topp",
  sortNew: "Nyeste",
  sortOld: "Eldste",

  // A comment
  reply: "Svar",
  viewMoreReplies: (count: number) => `Se flere svar (${count})`,
  hideReplies: "Skjul svar",
  removeYourReaction: "Fjern reaksjonen din",
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

  // Comments that can't be shown
  deleted: "[slettet]",
  removed: "[fjernet]",
  unavailable: "Denne kommentaren er ikke tilgjengelig",
  blockedAuthor: "Kommentar fra en bruker du har blokkert",
  showAnyway: "Vis likevel",
  removedByModerator: (reason?: string | null) =>
    `Fjernet av en moderator${reason ? `: ${reason}` : ""} · bare du kan se dette`,

  // Menus
  report: "Rapporter",
  remove: "Slett",
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
  loginRequired: "Logg inn for å utføre denne handlingen",
  commentEmpty: "Kommentaren kan ikke være tom",
  userNotMentionable:
    "Denne brukeren har ikke noe brukernavn og kan ikke nevnes",
  parentDeleted: "Denne kommentaren er slettet, så du kan ikke svare på den.",
  parentRemoved: "Denne kommentaren er fjernet, så du kan ikke svare på den.",
  postFailed: "Kunne ikke publisere kommentaren din. Prøv igjen.",
};

export default strings;
