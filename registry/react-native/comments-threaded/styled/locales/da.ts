import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Deltag i samtalen",
  cancel: "Annuller",
  replyingTo: "Svarer",
  cancelReply: "Annuller svar",

  // Comment list
  noCommentsTitle: "Ingen kommentarer endnu",
  noCommentsSubtitle: "Start samtalen.",
  viewAllComments: "Se alle kommentarer",
  loadMoreComments: "Indlæs flere kommentarer",
  loading: "Indlæser...",
  loadCommentsFailed: "Kommentarerne kunne ikke indlæses",
  loadMoreFailed: "Kunne ikke indlæse flere",
  tryAgain: "Prøv igen",

  // A comment
  reply: "Svar",
  replyCount: (count: number) => `${count} svar`,
  moreReplyCount: (count: number) => `${count} svar mere`,
  moreReplies: "Flere svar",
  continueThread: "Fortsæt tråden",
  removeYourVote: "Fjern din stemme",

  // Comments that can't be shown
  deleted: "[slettet]",
  removed: "[fjernet]",
  unavailable: "Denne kommentar er ikke tilgængelig",
  blockedAuthor: "Kommentar fra en bruger, du har blokeret",
  showAnyway: "Vis alligevel",
  removedByModerator: (reason?: string | null) =>
    `Fjernet af en moderator${reason ? `: ${reason}` : ""} · kun du kan se dette`,

  // Mentions
  noUsersFound: "Ingen brugere fundet",

  // Menus
  report: "Anmeld",
  delete: "Slet",
  deleteCommentTitle: "Slet kommentar",
  confirmDelete: "Er du sikker på, at du vil slette denne kommentar?",

  // Report dialog
  reportTitle: "Indsend en anmeldelse",
  reportIntro:
    "Tak, fordi du passer på vores fællesskab. Fortæl os, hvad der sker, så kigger vi på det.",
  reportReasons: {
    spam: "Det er spam",
    inappropriateContent: "Indeholder upassende indhold",
    harassment: "Det er chikane eller mobning",
    misinformation: "Spreder falske oplysninger",
    hateSpeech: "Indeholder hadefuld tale eller hadsymboler",
    violence: "Opfordrer til vold eller farlig adfærd",
    illegalActivity: "Opfordrer til ulovlig aktivitet",
    selfHarm: "Opfordrer til selvskade eller selvmord",
    other: "Andet",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Send anmeldelse",
  submittingReport: "Sender...",

  // Messages
  parentDeleted: "Denne kommentar er blevet slettet, så du kan ikke svare på den.",
  parentRemoved: "Denne kommentar er blevet fjernet, så du kan ikke svare på den.",
  postFailed: "Din kommentar kunne ikke slås op. Prøv igen.",
};

export default strings;
