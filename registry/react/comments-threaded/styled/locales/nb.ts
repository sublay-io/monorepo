import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Bli med i samtalen",
  replyPlaceholder: "Skriv svaret ditt...",
  cancel: "Avbryt",
  submitComment: "Publiser",
  addGif: "Legg til en GIF",

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
  continueThread: "Fortsett tråden",
  expandThread: "Utvid tråden",
  collapseThread: "Skjul tråden",
  moreOptions: "Flere alternativer",
  upvote: "Stem opp",
  downvote: "Stem ned",
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
  usernameRequired: "Velg et brukernavn før du samhandler med kommentarer",
  commentEmpty: "Kommentaren kan ikke være tom",
  userNotMentionable: "Denne brukeren kan ikke nevnes (ikke noe brukernavn valgt)",
  parentDeleted: "Denne kommentaren er slettet, så du kan ikke svare på den.",
  parentRemoved: "Denne kommentaren er fjernet, så du kan ikke svare på den.",
  postFailed: "Kunne ikke publisere kommentaren din. Prøv igjen.",
};

export default strings;
