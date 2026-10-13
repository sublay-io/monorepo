import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Doe mee aan het gesprek",
  cancel: "Annuleren",
  replyingTo: "Antwoord aan",
  cancelReply: "Antwoord annuleren",

  // Comment list
  noCommentsTitle: "Nog geen reacties",
  noCommentsSubtitle: "Begin het gesprek.",
  viewAllComments: "Alle reacties bekijken",
  loadMoreComments: "Meer reacties laden",
  loading: "Laden...",
  loadCommentsFailed: "Reacties konden niet worden geladen",
  loadMoreFailed: "Meer laden is mislukt",
  tryAgain: "Opnieuw proberen",

  // A comment
  reply: "Beantwoorden",
  replyCount: (count: number) => count === 1 ? "1 antwoord" : `${count} antwoorden`,
  moreReplyCount: (count: number) =>
    count === 1 ? "nog 1 antwoord" : `nog ${count} antwoorden`,
  moreReplies: "Meer antwoorden",
  continueThread: "Deze draad voortzetten",
  removeYourVote: "Je stem verwijderen",

  // Comments that can't be shown
  deleted: "[verwijderd]",
  removed: "[weggehaald]",
  unavailable: "Deze reactie is niet beschikbaar",
  blockedAuthor: "Reactie van een gebruiker die je hebt geblokkeerd",
  showAnyway: "Toch tonen",
  removedByModerator: (reason?: string | null) =>
    `Weggehaald door een moderator${reason ? `: ${reason}` : ""} · alleen zichtbaar voor jou`,

  // Mentions
  noUsersFound: "Geen gebruikers gevonden",

  // Menus
  report: "Melden",
  delete: "Verwijderen",
  deleteCommentTitle: "Reactie verwijderen",
  confirmDelete: "Weet je zeker dat je deze reactie wilt verwijderen?",

  // Report dialog
  reportTitle: "Een melding indienen",
  reportIntro:
    "Bedankt dat je op onze community let. Laat ons weten wat er aan de hand is, dan kijken we ernaar.",
  reportReasons: {
    spam: "Het is spam",
    inappropriateContent: "Bevat ongepaste inhoud",
    harassment: "Intimidatie of pesten",
    misinformation: "Verspreidt onjuiste informatie",
    hateSpeech: "Bevat haatdragende taal of symbolen",
    violence: "Zet aan tot geweld of gevaarlijk gedrag",
    illegalActivity: "Zet aan tot illegale activiteiten",
    selfHarm: "Zet aan tot zelfbeschadiging of zelfdoding",
    other: "Anders",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Melding indienen",
  submittingReport: "Bezig met verzenden...",

  // Messages
  parentDeleted: "Deze reactie is verwijderd, dus je kunt er niet op antwoorden.",
  parentRemoved: "Deze reactie is weggehaald, dus je kunt er niet op antwoorden.",
  postFailed: "Je reactie kon niet worden geplaatst. Probeer het opnieuw.",
};

export default strings;
