import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Voeg een reactie toe...",
  cancel: "Annuleren",
  post: "Plaatsen",
  replyingTo: (name: string) => `Antwoord aan ${name}`,

  // Comment list
  noCommentsTitle: "Nog geen reacties",
  noCommentsSubtitle: "Begin het gesprek.",
  loadCommentsFailed: "Reacties konden niet worden geladen",
  loadMoreFailed: "Meer laden is mislukt",
  tryAgain: "Opnieuw proberen",
  sortTop: "Top",
  sortNew: "Nieuw",
  sortOld: "Oud",

  // A comment
  reply: "Beantwoorden",
  viewMoreReplies: (count: number) => `Meer antwoorden bekijken (${count})`,
  hideReplies: "Antwoorden verbergen",
  removeYourReaction: "Je reactie-emoji verwijderen",
  timeAgo: {
    justNow: "Zojuist",
    minutes: (count: number) =>
      count === 1 ? "een minuut geleden" : `${count} minuten geleden`,
    hours: (count: number) => count === 1 ? "een uur geleden" : `${count} uur geleden`,
    days: (count: number) => count === 1 ? "een dag geleden" : `${count} dagen geleden`,
    months: (count: number) =>
      count === 1 ? "een maand geleden" : `${count} maanden geleden`,
    years: (count: number) =>
      count === 1 ? "een jaar geleden" : `${count} jaar geleden`,
  },

  // Comments that can't be shown
  deleted: "[verwijderd]",
  removed: "[weggehaald]",
  unavailable: "Deze reactie is niet beschikbaar",
  blockedAuthor: "Reactie van een gebruiker die je hebt geblokkeerd",
  showAnyway: "Toch tonen",
  removedByModerator: (reason?: string | null) =>
    `Weggehaald door een moderator${reason ? `: ${reason}` : ""} · alleen zichtbaar voor jou`,

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
